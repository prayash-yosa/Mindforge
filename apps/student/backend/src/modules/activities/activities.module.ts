/**
 * Mindforge Backend — Activities Module (Sprint 3–8)
 *
 * Wires activities + doubts + teacher content controllers,
 * core services, and Teacher-Grounded AI pipeline services.
 * Repositories come from the global DatabaseModule.
 * AI services come from the global AiModule.
 */

import { Module } from '@nestjs/common';
import { ActivitiesController } from './activities.controller';
import { DoubtsController } from './doubts.controller';
import { TeacherContentController } from './teacher-content.controller';
import { ActivitiesService } from './activities.service';
import { FeedbackService } from './feedback.service';
import { GradingService } from './grading.service';
import { DoubtService } from './doubt.service';
import { TeacherContentService } from './teacher-content.service';
import { RetrievalService } from './retrieval.service';
import { AiOrchestratorService } from './ai-orchestrator.service';
import { ResponseValidatorService } from './response-validator.service';
import { AiUsageLoggerService } from './ai-usage-logger.service';

@Module({
  controllers: [ActivitiesController, DoubtsController, TeacherContentController],
  providers: [
    ActivitiesService,
    FeedbackService,
    GradingService,
    DoubtService,
    TeacherContentService,
    RetrievalService,
    AiOrchestratorService,
    ResponseValidatorService,
    AiUsageLoggerService,
  ],
  exports: [
    ActivitiesService,
    FeedbackService,
    GradingService,
    DoubtService,
    TeacherContentService,
    RetrievalService,
    AiOrchestratorService,
    ResponseValidatorService,
    AiUsageLoggerService,
  ],
})
export class ActivitiesModule {}
