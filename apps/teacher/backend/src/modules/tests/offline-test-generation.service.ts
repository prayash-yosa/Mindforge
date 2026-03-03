import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { TestRepository } from '../../database/repositories/test.repository';
import { SyllabusRepository } from '../../database/repositories/syllabus.repository';
import { EntityNotFoundException, InvalidOperationException } from '../../common/exceptions/domain.exceptions';
import { TestQuestionEntity } from '../../database/entities/test-question.entity';
import { TestDefinitionEntity } from '../../database/entities/test-definition.entity';
import { AiAuditService } from '../../shared/ai-governance/ai-audit.service';
import { AiRateLimiterService } from '../../shared/ai-governance/ai-rate-limiter.service';

interface OfflineQuestion {
  questionType: string;
  questionText: string;
  options?: string[];
  correctAnswer: string;
  explanation: string;
  marks: number;
  stepwiseSolution?: string;
}

export interface PdfContent {
  studentPaper: string;
  answerKey: string;
  metadata: {
    title: string;
    subject: string;
    totalMarks: number;
    duration: string;
    date: string;
    questionCount: number;
  };
}

@Injectable()
export class OfflineTestGenerationService {
  private readonly logger = new Logger(OfflineTestGenerationService.name);
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
  ) {
    this.aiBaseUrl = this.configService.get<string>('ai.baseUrl') ?? 'https://api.openai.com/v1';
    this.aiApiKey = this.configService.get<string>('ai.apiKey') ?? '';
    this.aiModel = this.configService.get<string>('ai.model') ?? 'gpt-4o-mini';
    this.timeoutMs = this.configService.get<number>('ai.timeoutMs') ?? 15000;
  }

  async generateOfflineTest(
    testDefinitionId: string,
    lessonSessionId?: string,
    questionCount?: number,
  ): Promise<TestQuestionEntity[]> {
    const test = await this.testRepo.findDefinitionById(testDefinitionId);
    if (!test) throw new EntityNotFoundException('TestDefinition', testDefinitionId);

    if (test.mode !== 'offline') {
      throw new InvalidOperationException('Offline generation is only for offline tests');
    }

    const lsId = lessonSessionId ?? test.lessonSessionId;
    if (!lsId) {
      throw new InvalidOperationException('No lesson session linked — cannot generate questions');
    }

    const lesson = await this.syllabusRepo.findLessonById(lsId);
    if (!lesson) throw new EntityNotFoundException('LessonSession', lsId);

    const types = this.parseJsonArray(test.questionTypes);
    const count = questionCount ?? this.calculateQuestionCount(test.totalMarks, types);

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
      lesson.hasNumericals,
      test,
    );

    const entities = questions.map((q, i) => ({
      testDefinitionId,
      questionType: q.questionType,
      questionText: q.questionText,
      options: q.options ? JSON.stringify(q.options) : null,
      correctAnswer: q.correctAnswer,
      explanation: q.stepwiseSolution ?? q.explanation,
      marks: q.marks,
      orderIndex: i + 1,
    }));

    const saved = await this.testRepo.createQuestions(entities as Partial<TestQuestionEntity>[]);
    this.logger.log(`Generated ${saved.length} offline test questions for test ${testDefinitionId}`);
    return saved;
  }

  async generatePdfContent(testDefinitionId: string): Promise<PdfContent> {
    const test = await this.testRepo.findDefinitionById(testDefinitionId);
    if (!test) throw new EntityNotFoundException('TestDefinition', testDefinitionId);

    const questions = await this.testRepo.findQuestionsByTest(testDefinitionId);
    if (questions.length === 0) {
      throw new InvalidOperationException('No questions found — generate questions first');
    }

    const studentPaper = this.buildStudentPaper(test, questions);
    const answerKey = this.buildAnswerKey(test, questions);

    return {
      studentPaper,
      answerKey,
      metadata: {
        title: test.title,
        subject: test.subject,
        totalMarks: test.totalMarks,
        duration: `${test.durationMinutes} minutes`,
        date: test.scheduledAt?.toISOString().split('T')[0] ?? new Date().toISOString().split('T')[0],
        questionCount: questions.length,
      },
    };
  }

  private buildStudentPaper(test: TestDefinitionEntity, questions: TestQuestionEntity[]): string {
    const header = [
      '═══════════════════════════════════════════════════',
      '                    MINDFORGE',
      '═══════════════════════════════════════════════════',
      '',
      `Subject: ${test.subject}`,
      `Test: ${test.title}`,
      `Total Marks: ${test.totalMarks}`,
      `Duration: ${test.durationMinutes} minutes`,
      `Date: ${test.scheduledAt?.toISOString().split('T')[0] ?? '___________'}`,
      '',
      'Student Name: ___________________________',
      'Roll Number:  ___________________________',
      '',
      '═══════════════════════════════════════════════════',
      'INSTRUCTIONS:',
      '  1. Answer ALL questions.',
      '  2. Write clearly and legibly.',
      '  3. Marks are indicated for each question.',
      '═══════════════════════════════════════════════════',
      '',
    ];

    const sections = this.groupByType(questions);
    const body: string[] = [];
    let sectionLabel = 'A';

    for (const [type, qs] of sections) {
      body.push(`SECTION ${sectionLabel} — ${this.formatTypeName(type)} (${qs.reduce((s, q) => s + q.marks, 0)} marks)`);
      body.push('───────────────────────────────────────────────────');
      body.push('');

      for (const q of qs) {
        body.push(`Q${q.orderIndex}. [${q.marks} mark${q.marks > 1 ? 's' : ''}]`);
        body.push(`    ${q.questionText}`);

        if (q.options) {
          const opts = this.parseJsonArray(q.options);
          opts.forEach((opt, i) => {
            body.push(`    ${String.fromCharCode(65 + i)}) ${opt}`);
          });
        }

        body.push('');
      }

      sectionLabel = String.fromCharCode(sectionLabel.charCodeAt(0) + 1);
    }

    return [...header, ...body].join('\n');
  }

  private buildAnswerKey(test: TestDefinitionEntity, questions: TestQuestionEntity[]): string {
    const header = [
      '═══════════════════════════════════════════════════',
      '          MINDFORGE — TEACHER ANSWER KEY',
      '              *** CONFIDENTIAL ***',
      '═══════════════════════════════════════════════════',
      '',
      `Subject: ${test.subject}`,
      `Test: ${test.title}`,
      `Total Marks: ${test.totalMarks}`,
      '',
      '═══════════════════════════════════════════════════',
      '',
    ];

    const body: string[] = [];

    for (const q of questions) {
      body.push(`Q${q.orderIndex}. [${q.marks} mark${q.marks > 1 ? 's' : ''}] (${this.formatTypeName(q.questionType)})`);
      body.push(`    Question: ${q.questionText}`);
      body.push(`    Answer: ${q.correctAnswer}`);
      if (q.explanation) {
        body.push(`    Explanation: ${q.explanation}`);
      }
      body.push('');
    }

    return [...header, ...body].join('\n');
  }

  private async generateWithAi(
    conceptSummary: string,
    learningObjectives: string,
    subject: string,
    allowedTypes: string[],
    count: number,
    totalMarks: number,
    hasNumericals: boolean,
    test: { createdBy: string; classId: string },
  ): Promise<OfflineQuestion[]> {
    if (!this.aiApiKey) {
      this.logger.warn('No AI API key — using fallback offline question generation');
      return this.fallbackOfflineQuestions(allowedTypes, count, totalMarks, subject, hasNumericals);
    }

    const objectives = this.parseJsonArray(learningObjectives);
    const numericalInstruction = hasNumericals
      ? 'Include numerical/calculation questions with step-by-step solutions in "stepwiseSolution" field.'
      : 'No numerical questions needed based on the lesson content.';

    const systemPrompt = `You are an expert exam paper creator for ${subject}.

Generate exactly ${count} questions for a written exam. Distribute marks to total ${totalMarks}.

RULES:
- Allowed question types: ${allowedTypes.join(', ')}
- ${numericalInstruction}
- For MCQ: 4 options, one correct
- For short/long/very_short: provide model answer
- For numerical: provide step-by-step solution
- Every question needs an explanation

Return JSON array:
[{
  "questionType": "mcq|fill_in_blank|true_false|very_short|short|long|numerical",
  "questionText": "...",
  "options": [...] or null,
  "correctAnswer": "...",
  "explanation": "...",
  "marks": number,
  "stepwiseSolution": "..." (for numericals only)
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
          temperature: 0.4,
          max_tokens: 3000,
        }),
        signal: controller.signal,
      });

      clearTimeout(timeout);

      if (!response.ok) {
        const latencyMs = Date.now() - startMs;
        this.aiAudit.record({
          operation: 'offline_generation',
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
        operation: 'offline_generation',
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
          operation: 'offline_generation',
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
      this.logger.error(`AI offline generation failed: ${err.message}. Using fallback.`);
      return this.fallbackOfflineQuestions(allowedTypes, count, totalMarks, subject, hasNumericals);
    }
  }

  private fallbackOfflineQuestions(
    types: string[],
    count: number,
    totalMarks: number,
    subject: string,
    hasNumericals: boolean,
  ): OfflineQuestion[] {
    const questions: OfflineQuestion[] = [];
    let remainingMarks = totalMarks;

    for (let i = 0; i < count; i++) {
      const type = types[i % types.length];
      const isLast = i === count - 1;
      const marks = isLast ? remainingMarks : this.marksForType(type, Math.floor(remainingMarks / (count - i)));
      remainingMarks -= marks;

      const q: OfflineQuestion = {
        questionType: type,
        questionText: `[${subject} Q${i + 1}] ${this.placeholderForType(type, subject, hasNumericals && type === 'numerical')}`,
        correctAnswer: `Model answer for ${subject} question ${i + 1}.`,
        explanation: `This tests understanding of ${subject} fundamentals from the lesson.`,
        marks,
      };

      if (type === 'mcq') {
        q.options = ['Option A', 'Option B', 'Option C', 'Option D'];
        q.correctAnswer = 'Option A';
      }

      if (type === 'numerical' && hasNumericals) {
        q.stepwiseSolution = `Step 1: Identify given values.\nStep 2: Apply formula.\nStep 3: Calculate result.`;
      }

      questions.push(q);
    }

    return questions;
  }

  private placeholderForType(type: string, subject: string, isNumerical: boolean): string {
    const map: Record<string, string> = {
      mcq: `Which of the following is correct regarding ${subject}?`,
      fill_in_blank: `The fundamental principle of ${subject} states that ______.`,
      true_false: `The core concept discussed in the lesson is applicable in all scenarios. (True/False)`,
      very_short: `Define the key term discussed in ${subject}. (1-2 sentences)`,
      short: `Explain the main concept from the lesson in your own words. (3-5 sentences)`,
      long: `Discuss in detail the principles covered in ${subject}, with examples.`,
      numerical: `Solve the following problem using the formulas from ${subject}.`,
    };
    return map[type] ?? `Answer the following question about ${subject}.`;
  }

  private marksForType(type: string, avg: number): number {
    const weights: Record<string, number> = { mcq: 1, fill_in_blank: 1, true_false: 1, very_short: 2, short: 3, long: 5, numerical: 4 };
    return Math.max(1, weights[type] ?? avg);
  }

  private calculateQuestionCount(totalMarks: number, types: string[]): number {
    const avgWeight = types.reduce((s, t) => s + (this.marksForType(t, 2)), 0) / types.length;
    return Math.max(3, Math.min(30, Math.round(totalMarks / avgWeight)));
  }

  private groupByType(questions: TestQuestionEntity[]): [string, TestQuestionEntity[]][] {
    const map = new Map<string, TestQuestionEntity[]>();
    for (const q of questions) {
      if (!map.has(q.questionType)) map.set(q.questionType, []);
      map.get(q.questionType)!.push(q);
    }
    return [...map.entries()];
  }

  private formatTypeName(type: string): string {
    const names: Record<string, string> = {
      mcq: 'Multiple Choice', fill_in_blank: 'Fill in the Blanks', true_false: 'True or False',
      very_short: 'Very Short Answer', short: 'Short Answer', long: 'Long Answer', numerical: 'Numerical Problems',
    };
    return names[type] ?? type;
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
