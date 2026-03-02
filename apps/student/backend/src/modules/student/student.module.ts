/**
 * Mindforge Backend — Student Module (Task 2.3)
 *
 * Wires student controller and service.
 * Repositories come from the global DatabaseModule.
 */

import { Module } from '@nestjs/common';
import { StudentController } from './student.controller';
import { StudentService } from './student.service';

@Module({
  controllers: [StudentController],
  providers: [StudentService],
  exports: [StudentService],
})
export class StudentModule {}
