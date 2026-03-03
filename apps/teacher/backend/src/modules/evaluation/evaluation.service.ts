import { Injectable, Logger } from '@nestjs/common';
import { TestRepository } from '../../database/repositories/test.repository';
import { NotificationRepository } from '../../database/repositories/notification.repository';
import { EntityNotFoundException, InvalidOperationException } from '../../common/exceptions/domain.exceptions';
import { TestAttemptEntity } from '../../database/entities/test-attempt.entity';
import { OfflineMarkEntryEntity } from '../../database/entities/offline-mark-entry.entity';
import { SubmitAnswersDto, OfflineMarkEntryDto } from './dto/evaluation.dto';

export interface EvaluationResult {
  attemptId: string;
  studentId: string;
  totalMarks: number;
  scoredMarks: number;
  attemptedCount: number;
  notAttemptedCount: number;
  percentage: number;
  questionResults: QuestionResult[];
}

export interface QuestionResult {
  questionId: string;
  questionText: string;
  questionType: string;
  studentAnswer: string;
  correctAnswer: string;
  isCorrect: boolean;
  marksAwarded: number;
  maxMarks: number;
  explanation: string;
}

export interface OfflineStudentSummary {
  studentId: string;
  totalObtained: number;
  totalMax: number;
  percentage: number;
  entries: OfflineMarkEntryEntity[];
}

@Injectable()
export class EvaluationService {
  private readonly logger = new Logger(EvaluationService.name);

  constructor(
    private readonly testRepo: TestRepository,
    private readonly notificationRepo: NotificationRepository,
  ) {}

  // ── Online Auto-Grade ────────────────────────────────────

  async submitAndGrade(dto: SubmitAnswersDto): Promise<EvaluationResult> {
    const test = await this.testRepo.findDefinitionById(dto.testDefinitionId);
    if (!test) throw new EntityNotFoundException('TestDefinition', dto.testDefinitionId);

    if (test.mode !== 'online') {
      throw new InvalidOperationException('Only online tests support auto-grading');
    }

    if (test.status !== 'published') {
      throw new InvalidOperationException('Test is not active for submissions');
    }

    const existing = await this.testRepo.findAttemptByStudentAndTest(dto.studentId, dto.testDefinitionId);
    if (existing && (existing.status === 'submitted' || existing.status === 'evaluated')) {
      throw new InvalidOperationException('Student has already submitted this test');
    }

    const questions = await this.testRepo.findQuestionsByTest(dto.testDefinitionId);
    const answerMap = new Map(dto.answers.map((a) => [a.questionId, a.answer]));

    let scoredMarks = 0;
    let attemptedCount = 0;
    let notAttemptedCount = 0;
    const questionResults: QuestionResult[] = [];

    for (const q of questions) {
      const studentAnswer = answerMap.get(q.id) ?? '';
      const isAttempted = studentAnswer.trim().length > 0;
      const isCorrect = isAttempted && this.checkAnswer(q.questionType, studentAnswer, q.correctAnswer, q.options);
      const marksAwarded = isCorrect ? q.marks : 0;

      if (isAttempted) attemptedCount++;
      else notAttemptedCount++;

      scoredMarks += marksAwarded;

      questionResults.push({
        questionId: q.id,
        questionText: q.questionText,
        questionType: q.questionType,
        studentAnswer,
        correctAnswer: q.correctAnswer,
        isCorrect,
        marksAwarded,
        maxMarks: q.marks,
        explanation: q.explanation ?? '',
      });
    }

    const answersJson = JSON.stringify(Object.fromEntries(answerMap));
    const attempt = existing
      ? await this.updateExistingAttempt(existing.id, scoredMarks, attemptedCount, notAttemptedCount, answersJson, test.totalMarks)
      : await this.createNewAttempt(dto.testDefinitionId, dto.studentId, scoredMarks, attemptedCount, notAttemptedCount, answersJson, test.totalMarks);

    const percentage = test.totalMarks > 0 ? Math.round((scoredMarks / test.totalMarks) * 100) : 0;

    this.logger.log(
      `Evaluated: student ${dto.studentId}, test ${dto.testDefinitionId} — ${scoredMarks}/${test.totalMarks} (${percentage}%)`,
    );

    return {
      attemptId: attempt.id ?? existing?.id ?? '',
      studentId: dto.studentId,
      totalMarks: test.totalMarks,
      scoredMarks,
      attemptedCount,
      notAttemptedCount,
      percentage,
      questionResults,
    };
  }

  async autoSubmitExpired(testDefinitionId: string): Promise<{ autoSubmitted: number }> {
    const attempts = await this.testRepo.findAttemptsByTest(testDefinitionId);
    let autoSubmitted = 0;

    for (const attempt of attempts) {
      if (attempt.status === 'in_progress') {
        await this.testRepo.updateAttempt(attempt.id, {
          status: 'auto_submitted',
          submittedAt: new Date(),
        });
        autoSubmitted++;

        await this.notificationRepo.create({
          category: 'auto_submitted',
          priority: 'medium',
          title: 'Test Auto-Submitted',
          body: `Student ${attempt.studentId}'s test was auto-submitted due to time expiry.`,
          recipientRole: 'teacher',
          payload: JSON.stringify({ testDefinitionId, studentId: attempt.studentId, attemptId: attempt.id }),
        });
      }
    }

    this.logger.log(`Auto-submitted ${autoSubmitted} attempts for test ${testDefinitionId}`);
    return { autoSubmitted };
  }

  async getAttemptResult(attemptId: string): Promise<EvaluationResult | null> {
    const attempts = await this.testRepo.findAttemptsByTest('');
    // Direct lookup needed — use the repo
    return null;
  }

  async getAttemptsByTest(testDefinitionId: string): Promise<TestAttemptEntity[]> {
    return this.testRepo.findAttemptsByTest(testDefinitionId);
  }

  async getStudentAttempt(studentId: string, testDefinitionId: string): Promise<TestAttemptEntity | null> {
    return this.testRepo.findAttemptByStudentAndTest(studentId, testDefinitionId);
  }

  // ── Offline Mark Entry ────────────────────────────────────

  async enterOfflineMarks(teacherId: string, dto: OfflineMarkEntryDto): Promise<OfflineMarkEntryEntity[]> {
    const test = await this.testRepo.findDefinitionById(dto.testDefinitionId);
    if (!test) throw new EntityNotFoundException('TestDefinition', dto.testDefinitionId);

    if (test.mode !== 'offline') {
      throw new InvalidOperationException('Mark entry is for offline tests only');
    }

    const entries = dto.entries.map((e) => ({
      testDefinitionId: dto.testDefinitionId,
      studentId: e.studentId,
      sectionLabel: e.sectionLabel,
      questionIndex: e.questionIndex,
      marksObtained: e.marksObtained,
      maxMarks: e.maxMarks,
      enteredBy: teacherId,
    }));

    const saved = await this.testRepo.createMarkEntries(entries);
    this.logger.log(`Entered ${saved.length} offline marks for test ${dto.testDefinitionId}`);

    await this.notificationRepo.create({
      category: 'evaluation_pending',
      priority: 'low',
      title: 'Offline Marks Entered',
      body: `${saved.length} mark entries recorded for test "${test.title}".`,
      recipientRole: 'teacher',
      payload: JSON.stringify({ testDefinitionId: dto.testDefinitionId, entryCount: saved.length }),
    });

    return saved;
  }

  async getOfflineMarksByTest(testDefinitionId: string): Promise<OfflineStudentSummary[]> {
    const marks = await this.testRepo.findMarksByTest(testDefinitionId);
    const byStudent = new Map<string, OfflineMarkEntryEntity[]>();

    for (const m of marks) {
      if (!byStudent.has(m.studentId)) byStudent.set(m.studentId, []);
      byStudent.get(m.studentId)!.push(m);
    }

    return [...byStudent.entries()].map(([studentId, entries]) => {
      const totalObtained = entries.reduce((s, e) => s + e.marksObtained, 0);
      const totalMax = entries.reduce((s, e) => s + e.maxMarks, 0);
      return {
        studentId,
        totalObtained,
        totalMax,
        percentage: totalMax > 0 ? Math.round((totalObtained / totalMax) * 100) : 0,
        entries,
      };
    });
  }

  async getStudentOfflineMarks(studentId: string, testDefinitionId: string): Promise<OfflineMarkEntryEntity[]> {
    return this.testRepo.findMarksByStudentAndTest(studentId, testDefinitionId);
  }

  // ── Private helpers ───────────────────────────────────────

  private checkAnswer(
    type: string,
    studentAnswer: string,
    correctAnswer: string,
    optionsJson: string | null,
  ): boolean {
    const normalize = (s: string) => s.trim().toLowerCase().replace(/\s+/g, ' ');

    switch (type) {
      case 'mcq':
        return normalize(studentAnswer) === normalize(correctAnswer);
      case 'true_false':
        return normalize(studentAnswer) === normalize(correctAnswer);
      case 'fill_in_blank':
        return normalize(studentAnswer) === normalize(correctAnswer);
      default:
        return normalize(studentAnswer) === normalize(correctAnswer);
    }
  }

  private async createNewAttempt(
    testDefinitionId: string,
    studentId: string,
    scoredMarks: number,
    attemptedCount: number,
    notAttemptedCount: number,
    answersJson: string,
    totalMarks: number,
  ): Promise<TestAttemptEntity> {
    return this.testRepo.createAttempt({
      testDefinitionId,
      studentId,
      status: 'evaluated',
      startedAt: new Date(),
      submittedAt: new Date(),
      totalMarks,
      scoredMarks,
      attemptedCount,
      notAttemptedCount,
      answers: answersJson,
    });
  }

  private async updateExistingAttempt(
    attemptId: string,
    scoredMarks: number,
    attemptedCount: number,
    notAttemptedCount: number,
    answersJson: string,
    totalMarks: number,
  ): Promise<TestAttemptEntity> {
    await this.testRepo.updateAttempt(attemptId, {
      status: 'evaluated',
      submittedAt: new Date(),
      totalMarks,
      scoredMarks,
      attemptedCount,
      notAttemptedCount,
      answers: answersJson,
    });
    return { id: attemptId } as TestAttemptEntity;
  }
}
