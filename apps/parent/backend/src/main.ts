import { NestFactory } from '@nestjs/core';
import { Logger } from '@nestjs/common';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const logger = new Logger('ParentService');

  app.setGlobalPrefix('v1');

  const port = process.env.PARENT_SERVICE_PORT ?? 3002;
  await app.listen(port);
  logger.log(`Parent service running on port ${port}`);
}

bootstrap();
