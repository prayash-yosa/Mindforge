/**
 * Mindforge Backend — @Student() Parameter Decorator (Task 1.4)
 *
 * Extracts the authenticated student from the request.
 * Used in controllers to access the student context set by AuthGuard.
 *
 * Usage:
 *   @Get('today')
 *   getToday(@Student() student: AuthenticatedStudent) {
 *     return this.service.getTodayPlan(student.id);
 *   }
 *
 *   @Get('profile')
 *   getProfile(@Student('id') studentId: string) {
 *     return this.service.getProfile(studentId);
 *   }
 *
 * Checklist 1.4: "Authenticated student_id available to business layer for scope"
 */

import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { AuthenticatedStudent } from '../guards/auth.guard';

export const Student = createParamDecorator(
  (data: keyof AuthenticatedStudent | undefined, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    const student: AuthenticatedStudent = request.student;

    if (!student) {
      return undefined;
    }

    return data ? student[data] : student;
  },
);
