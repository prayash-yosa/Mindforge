import { Module } from '@nestjs/common';
import { MulterModule } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { SyllabusController } from './syllabus.controller';
import { SyllabusUploadService } from './syllabus-upload.service';
import { SyllabusReadService } from './syllabus-read.service';
import { AiIngestionService } from './ai-ingestion.service';

@Module({
  imports: [
    MulterModule.register({ storage: memoryStorage() }),
  ],
  controllers: [SyllabusController],
  providers: [SyllabusUploadService, SyllabusReadService, AiIngestionService],
  exports: [SyllabusReadService, AiIngestionService],
})
export class SyllabusModule {}
