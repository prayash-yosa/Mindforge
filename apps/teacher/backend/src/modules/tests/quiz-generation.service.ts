import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { TestRepository } from '../../database/repositories/test.repository';
import { SyllabusRepository } from '../../database/repositories/syllabus.repository';
import { EntityNotFoundException, InvalidOperationException } from '../../common/exceptions/domain.exceptions';
import { TestQuestionEntity } from '../../database/entities/test-question.entity';
import { AiAuditService } from '../../shared/ai-governance/ai-audit.service';
import { AiRateLimiterService } from '../../shared/ai-governance/ai-rate-limiter.service';
import { NumericalValidatorService } from '../../shared/ai-governance/numerical-validator.service';

interface AiQuestion {
  questionType: string;
  questionText: string;
  options?: string[];
  correctAnswer: string;
  explanation: string;
  marks: number;
}

@Injectable()
export class QuizGenerationService {
  private readonly logger = new Logger(QuizGenerationService.name);
  private readonly aiBaseUrl: string;
  private readonly aiApiKey: string;
  private readonly aiModel: string;
  private readonly timeoutMs: number;

  constructor(
    private readonly testRepo: TestRepository,
    private readonly syllabusRepo: SyllabusRepository,
    private readonly configService: ConfigService,
    private readonly aiAudit: AiAuditService,
    private readonly aiRateLimiter: AiRateLimiterService,
    private readonly numericalValidator: NumericalValidatorService,
  ) {
    this.aiBaseUrl = this.configService.get<string>('ai.baseUrl') ?? 'https://api.openai.com/v1';
    this.aiApiKey = this.configService.get<string>('ai.apiKey') ?? '';
    this.aiModel = this.configService.get<string>('ai.model') ?? 'gpt-4o-mini';
    this.timeoutMs = this.configService.get<number>('ai.timeoutMs') ?? 15000;
  }

  async generateOnlineQuiz(
    testDefinitionId: string,
    lessonSessionId?: string,
    questionCount?: number,
  ): Promise<TestQuestionEntity[]> {
    const test = await this.testRepo.findDefinitionById(testDefinitionId);
    if (!test) throw new EntityNotFoundException('TestDefinition', testDefinitionId);

    if (test.mode !== 'online') {
      throw new InvalidOperationException('AI quiz generation is only for online tests');
    }

    const lsId = lessonSessionId ?? test.lessonSessionId;
    if (!lsId) {
      throw new InvalidOperationException('No lesson session linked — cannot generate questions');
    }

    const lesson = await this.syllabusRepo.findLessonById(lsId);
    if (!lesson) throw new EntityNotFoundException('LessonSession', lsId);

    const types = this.parseJsonArray(test.questionTypes);
    const count = questionCount ?? Math.max(Math.floor(test.totalMarks / 1), 5);

    const rateCheck = this.aiRateLimiter.checkLimit(test.classId);
    if (!rateCheck.allowed) {
      throw new InvalidOperationException(`AI rate limit exceeded: ${rateCheck.reason}`);
    }

    const questions = await this.generateWithAi(
      lesson.conceptSummary,
      lesson.learningObjectives,
      lesson.subject,
      types,
      count,
      test.totalMarks,
      false, // no numericals for online
      test,
    );

    this.numericalValidator.validateOnlineQuizQuestions(questions);
    const validated = this.numericalValidator.filterNumericalQuestions(questions);

    const entities = validated.map((q, i) => ({
      testDefinitionId,
      questionType: q.questionType,
      questionText: q.questionText,
      options: q.options ? JSON.stringify(q.options) : null,
      correctAnswer: q.correctAnswer,
      explanation: q.explanation,
      marks: q.marks,
      orderIndex: i + 1,
    }));

    const saved = await this.testRepo.createQuestions(entities as Partial<TestQuestionEntity>[]);
    this.logger.log(`Generated ${saved.length} online quiz questions for test ${testDefinitionId}`);
    return saved;
  }

  private async generateWithAi(
    conceptSummary: string,
    learningObjectives: string,
    subject: string,
    allowedTypes: string[],
    count: number,
    totalMarks: number,
    includeNumericals: boolean,
    test: { createdBy: string; classId: string },
  ): Promise<AiQuestion[]> {
    if (!this.aiApiKey) {
      this.logger.warn('No AI API key — using fallback question generation');
      return this.fallbackQuestions(allowedTypes, count, totalMarks, subject, conceptSummary);
    }

    const objectives = this.parseJsonArray(learningObjectives);
    const numericalRule = includeNumericals
      ? 'You MAY include numerical/calculation questions if relevant.'
      : 'STRICTLY NO numericals, calculations, or value-solving problems. Only conceptual questions.';

    const systemPrompt = `You are an expert exam question generator for ${subject}.

Generate exactly ${count} questions from the provided concepts. Distribute marks to total ${totalMarks}.

RULES:
- Allowed question types: ${allowedTypes.join(', ')}
- ${numericalRule}
- For MCQ: exactly 4 options, one correct
- For fill_in_blank: provide the expected answer
- For true_false: correctAnswer must be "True" or "False"
- Every question must have a clear explanation referencing the concept

Return a JSON array of objects:
[{
  "questionType": "mcq|fill_in_blank|true_false",
  "questionText": "...",
  "options": ["A", "B", "C", "D"] or null,
  "correctAnswer": "...",
  "explanation": "...",
  "marks": number
}]

Return ONLY valid JSON array, no markdown.`;

    const userPrompt = `CONCEPTS: ${conceptSummary}\n\nLEARNING OBJECTIVES:\n${objectives.map((o, i) => `${i + 1}. ${o}`).join('\n')}`;

    const startMs = Date.now();
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), this.timeoutMs);

      const response = await fetch(`${this.aiBaseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.aiApiKey}`,
        },
        body: JSON.stringify({
          model: this.aiModel,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt },
          ],
          temperature: 0.3,
          max_tokens: 2048,
        }),
        signal: controller.signal,
      });

      clearTimeout(timeout);

      if (!response.ok) {
        const latencyMs = Date.now() - startMs;
        this.aiAudit.record({
          operation: 'quiz_generation',
          model: this.aiModel,
          teacherId: test.createdBy || 'unknown',
          classId: test.classId,
          inputTokenEstimate: Math.ceil(userPrompt.length / 4),
          outputTokenEstimate: 0,
          latencyMs,
          success: false,
          errorCode: `HTTP_${response.status}`,
        });
        throw new Error(`AI API returned ${response.status}`);
      }

      const data = await response.json() as any;
      const content = data.choices?.[0]?.message?.content ?? '';
      const usage = data.usage;
      const inputTokens = usage?.prompt_tokens ?? Math.ceil(userPrompt.length / 4);
      const outputTokens = usage?.completion_tokens ?? Math.ceil(content.length / 4);
      const latencyMs = Date.now() - startMs;

      this.aiAudit.record({
        operation: 'quiz_generation',
        model: this.aiModel,
        teacherId: test.createdBy || 'unknown',
        classId: test.classId,
        inputTokenEstimate: inputTokens,
        outputTokenEstimate: outputTokens,
        latencyMs,
        success: true,
      });

      const cleaned = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      const parsed = JSON.parse(cleaned);

      if (!Array.isArray(parsed)) throw new Error('AI did not return an array');
      return parsed;
    } catch (err: any) {
      const latencyMs = Date.now() - startMs;
      const isHttpError = err.message?.includes('AI API returned');
      if (!isHttpError) {
        this.aiAudit.record({
          operation: 'quiz_generation',
          model: this.aiModel,
          teacherId: test.createdBy || 'unknown',
          classId: test.classId,
          inputTokenEstimate: Math.ceil(userPrompt.length / 4),
          outputTokenEstimate: 0,
          latencyMs,
          success: false,
          errorCode: err.name || 'UNKNOWN',
        });
      }
      this.logger.error(`AI question generation failed: ${err.message}. Using fallback.`);
      return this.fallbackQuestions(allowedTypes, count, totalMarks, subject, conceptSummary);
    }
  }

  private fallbackQuestions(
    types: string[],
    count: number,
    totalMarks: number,
    subject: string,
    concepts: string,
  ): AiQuestion[] {
    const marksPerQ = Math.max(1, Math.floor(totalMarks / count));
    const questions: AiQuestion[] = [];

    for (let i = 0; i < count; i++) {
      const type = types[i % types.length];
      const base = {
        marks: i === count - 1 ? totalMarks - marksPerQ * (count - 1) : marksPerQ,
        explanation: `Based on ${subject} concepts from the provided lesson material.`,
      };

      if (type === 'mcq') {
        questions.push({
          ...base,
          questionType: 'mcq',
          questionText: `[${subject} Q${i + 1}] Which of the following best describes a key concept from the lesson?`,
          options: ['Option A - Correct concept', 'Option B - Related but incorrect', 'Option C - Common misconception', 'Option D - Unrelated concept'],
          correctAnswer: 'Option A - Correct concept',
        });
      } else if (type === 'fill_in_blank') {
        questions.push({
          ...base,
          questionType: 'fill_in_blank',
          questionText: `[${subject} Q${i + 1}] The key principle discussed in the lesson is called ______.`,
          correctAnswer: 'the core concept',
        });
      } else {
        questions.push({
          ...base,
          questionType: 'true_false',
          questionText: `[${subject} Q${i + 1}] The concepts covered in this lesson relate directly to ${subject} fundamentals. (True/False)`,
          correctAnswer: 'True',
        });
      }
    }

    return questions;
  }

  private parseJsonArray(raw?: string | null): string[] {
    if (!raw) return [];
    try {
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return raw.split(',').map((s) => s.trim()).filter(Boolean);
    }
  }
}
