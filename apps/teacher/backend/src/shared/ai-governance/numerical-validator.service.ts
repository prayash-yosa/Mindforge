import { Injectable, Logger } from '@nestjs/common';

export interface ValidationResult {
  valid: boolean;
  violations: string[];
  filteredCount: number;
}

@Injectable()
export class NumericalValidatorService {
  private readonly logger = new Logger('NumericalValidator');

  private readonly NUMERICAL_PATTERNS = [
    /\bcalculat[e|ing]\b/i,
    /\bsolve\b/i,
    /\bfind the value\b/i,
    /\bcompute\b/i,
    /\bhow (?:much|many)\b.*\bif\b/i,
    /\bwhat is the (?:sum|product|difference|quotient|result)\b/i,
    /\b\d+\s*[\+\-\×\÷\*\/\=]\s*\d+/,
    /\bevaluate\b.*\bexpression\b/i,
    /\bformula\b.*\bapply\b/i,
    /\bnumeric(?:al)?\b/i,
    /\barithmet(?:ic|ical)\b.*\bproblem\b/i,
    /\bequation\b.*\bsolve\b/i,
    /\bderive\b.*\bvalue\b/i,
    /\bsimplify\b.*\b\d/i,
  ];

  validateOnlineQuizQuestions(
    questions: Array<{ questionType: string; questionText: string }>,
  ): ValidationResult {
    const violations: string[] = [];
    let filteredCount = 0;

    for (const q of questions) {
      if (q.questionType === 'numerical') {
        violations.push(`Question type "numerical" not allowed in online quizzes`);
        filteredCount++;
        continue;
      }

      for (const pattern of this.NUMERICAL_PATTERNS) {
        if (pattern.test(q.questionText)) {
          violations.push(
            `Potential numerical content detected: "${q.questionText.substring(0, 60)}..."`,
          );
          filteredCount++;
          break;
        }
      }
    }

    if (violations.length > 0) {
      this.logger.warn(
        `Numerical validation: ${violations.length} violation(s) found, ${filteredCount} questions flagged`,
      );
    }

    return {
      valid: violations.length === 0,
      violations,
      filteredCount,
    };
  }

  /** Returns only questions that pass numerical validation (for online quizzes) */
  filterNumericalQuestions<T extends { questionType: string; questionText: string }>(
    questions: T[],
  ): T[] {
    return questions.filter((q) => {
      if (q.questionType === 'numerical') return false;
      for (const pattern of this.NUMERICAL_PATTERNS) {
        if (pattern.test(q.questionText)) return false;
      }
      return true;
    });
  }
}
