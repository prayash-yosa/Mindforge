import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export interface AuthenticatedTeacher {
  id: string;
  teacherId: string;
  name?: string;
  role: string;
}

export const Teacher = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): AuthenticatedTeacher => {
    const request = ctx.switchToHttp().getRequest();
    return request.teacher;
  },
);
