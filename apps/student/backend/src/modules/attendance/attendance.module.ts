/**
 * Mindforge Backend — Attendance Module (Sprint 5)
 *
 * Wires attendance controller and service.
 * Repositories come from the global DatabaseModule.
 */

import { Module } from '@nestjs/common';
import { AttendanceController } from './attendance.controller';
import { AttendanceService } from './attendance.service';

@Module({
  controllers: [AttendanceController],
  providers: [AttendanceService],
  exports: [AttendanceService],
})
export class AttendanceModule {}
