import { Module } from '@nestjs/common';
import { AnalyticsController } from './analytics.controller';
import { CrossAppController } from './cross-app.controller';
import { AnalyticsService } from './analytics.service';
import { AttendanceService } from '../class-attendance/attendance.service';
import { EvaluationService } from '../evaluation/evaluation.service';

@Module({
  controllers: [AnalyticsController, CrossAppController],
  providers: [AnalyticsService, AttendanceService, EvaluationService],
  exports: [AnalyticsService],
})
export class AnalyticsModule {}
