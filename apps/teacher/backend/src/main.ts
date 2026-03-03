import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import helmet from 'helmet';
import { AppModule } from './app.module';

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  const app = await NestFactory.create(AppModule);

  const config = app.get(ConfigService);
  const port = config.get<number>('port') ?? 3003;
  const isProduction = config.get<boolean>('isProduction');
  const corsOrigins = config.get<string[]>('corsOrigins') ?? [
    'http://localhost:3000',
    'http://localhost:5175',
  ];

  if (config.get<boolean>('trustProxy')) {
    const expressApp = app.getHttpAdapter().getInstance();
    expressApp.set('trust proxy', 1);
  }

  app.use(helmet());

  app.enableCors({
    origin: corsOrigins,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Request-Id'],
    credentials: true,
    maxAge: 86400,
  });

  app.setGlobalPrefix('v1');

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
      errorHttpStatusCode: 400,
    }),
  );

  if (!isProduction) {
    const swaggerConfig = new DocumentBuilder()
      .setTitle('Mindforge Teacher Service API')
      .setDescription(
        'REST API for the Mindforge Teacher application.\n\n' +
        'Handles class management, attendance, syllabus, tests, evaluation, and analytics.\n\n' +
        'Error shape: `{ code, message, details? }`',
      )
      .setVersion('1.0')
      .addBearerAuth()
      .addTag('Health', 'Service health check')
      .addTag('Classes', 'Class & session management')
      .addTag('Attendance', 'Attendance marking & aggregation')
      .addTag('Syllabus', 'Syllabus upload & AI processing')
      .addTag('Tests', 'Test authoring & generation')
      .addTag('Evaluation', 'Auto-grading & mark entry')
      .addTag('Analytics', 'Performance & attendance dashboards')
      .addTag('Notifications', 'Alerts & messages')
      .build();

    const document = SwaggerModule.createDocument(app, swaggerConfig);
    SwaggerModule.setup('api/docs', app, document);
    logger.log(`OpenAPI docs available at http://localhost:${port}/api/docs`);
  }

  app.enableShutdownHooks();

  await app.listen(port);

  logger.log('=== Teacher Service Startup ===');
  logger.log(`Environment: ${isProduction ? 'PRODUCTION' : 'DEVELOPMENT'}`);
  logger.log(`Port: ${port}`);
  logger.log(`CORS Origins: ${corsOrigins.join(', ')}`);
  logger.log(
    `Database: ${config.get('database.url') ? 'PostgreSQL (URL configured)' : 'SQLite (dev mode)'}`,
  );
  logger.log(
    `AI Provider: ${config.get('ai.apiKey') ? 'Configured' : 'Not configured (fallback mode)'}`,
  );
  logger.log(
    `Throttle: ${config.get('throttle.limit')} req/${config.get('throttle.ttl')}s`,
  );
  logger.log(
    `Swagger: ${isProduction ? 'Disabled' : `http://localhost:${port}/api/docs`}`,
  );
  logger.log('==============================');
}

bootstrap();
