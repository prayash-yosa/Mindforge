import { NestFactory } from '@nestjs/core';
import { Logger } from '@nestjs/common';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const logger = new Logger('TeacherService');

  app.setGlobalPrefix('v1');

  const port = process.env.TEACHER_SERVICE_PORT ?? 3003;
  await app.listen(port);
  logger.log(`Teacher service running on port ${port}`);
}

bootstrap();
