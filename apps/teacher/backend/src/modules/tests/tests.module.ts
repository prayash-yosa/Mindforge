import { Module } from '@nestjs/common';
import { TestsController } from './tests.controller';
import { TestAuthoringService } from './test-authoring.service';
import { QuizGenerationService } from './quiz-generation.service';
import { OfflineTestGenerationService } from './offline-test-generation.service';

@Module({
  controllers: [TestsController],
  providers: [TestAuthoringService, QuizGenerationService, OfflineTestGenerationService],
  exports: [TestAuthoringService, QuizGenerationService, OfflineTestGenerationService],
})
export class TestsModule {}
