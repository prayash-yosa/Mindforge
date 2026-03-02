/**
 * Mindforge Backend — Syllabus Module (Task 5.2)
 *
 * Wires syllabus controller and service.
 * Repositories come from the global DatabaseModule.
 */

import { Module } from '@nestjs/common';
import { SyllabusController } from './syllabus.controller';
import { SyllabusService } from './syllabus.service';

@Module({
  controllers: [SyllabusController],
  providers: [SyllabusService],
  exports: [SyllabusService],
})
export class SyllabusModule {}
