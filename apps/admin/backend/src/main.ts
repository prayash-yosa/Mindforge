import { NestFactory } from '@nestjs/core';
import { Logger } from '@nestjs/common';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const logger = new Logger('AdminService');

  app.setGlobalPrefix('v1');

  const port = process.env.ADMIN_SERVICE_PORT ?? 3004;
  await app.listen(port);
  logger.log(`Admin service running on port ${port}`);
}

bootstrap();
