/**
 * Mindforge Backend — Application Entry Point
 *
 * Bootstraps the NestJS application with:
 *   - Helmet security headers
 *   - CORS configuration
 *   - Global validation pipe (DTO validation everywhere)
 *   - OpenAPI / Swagger documentation
 *   - Graceful shutdown
 *
 * Architecture ref: §3.1 "API / Gateway layer"
 */

import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger, VersioningType } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import helmet from 'helmet';
import { AppModule } from './app.module';

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  const app = await NestFactory.create(AppModule);

  const config = app.get(ConfigService);
  const port = config.get<number>('port') ?? 3000;
  const isProduction = config.get<boolean>('isProduction');
  const corsOrigins = config.get<string[]>('corsOrigins') ?? [
    'http://localhost:3001',
    'http://localhost:5173',
    'http://127.0.0.1:5173',
    'http://10.0.2.2:5173',
  ];

  // ── Trust proxy (behind LB) ───────────────────────────────────
  if (config.get<boolean>('trustProxy')) {
    const expressApp = app.getHttpAdapter().getInstance();
    expressApp.set('trust proxy', 1);
  }

  // ── Security headers ──────────────────────────────────────────
  app.use(helmet());

  // ── CORS ──────────────────────────────────────────────────────
  app.enableCors({
    origin: corsOrigins,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Request-Id', 'X-Teacher-Id'],
    credentials: true,
    maxAge: 86400,
  });

  // ── Global Validation Pipe (DTO validation everywhere) ────────
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,           // Strip unknown properties
      forbidNonWhitelisted: true, // Error on unknown properties
      transform: true,           // Auto-transform payloads to DTO instances
      transformOptions: {
        enableImplicitConversion: true,
      },
      errorHttpStatusCode: 400,
    }),
  );

  // ── OpenAPI / Swagger (source of truth) ───────────────────────
  if (!isProduction) {
    const swaggerConfig = new DocumentBuilder()
      .setTitle('Mindforge Student Experience API')
      .setDescription(
        'REST API for the Mindforge Student Experience platform.\n\n' +
        'Error shape: `{ code, message, details? }`\n\n' +
        'All endpoints under `/v1/` require Bearer token except `/health` and `/v1/auth/*`.',
      )
      .setVersion('1.0')
      .addBearerAuth()
      .addTag('Health', 'Load balancer health check')
      .addTag('Auth', 'MPIN verification, lockout, recovery')
      .build();

    const document = SwaggerModule.createDocument(app, swaggerConfig);
    SwaggerModule.setup('api/docs', app, document);
    logger.log(`OpenAPI docs available at http://localhost:${port}/api/docs`);
  }

  // ── Graceful shutdown ─────────────────────────────────────────
  app.enableShutdownHooks();

  await app.listen(port);
  logger.log(`Mindforge backend running on port ${port} (${isProduction ? 'production' : 'development'})`);
  logger.log(`Health check: http://localhost:${port}/health`);
}

bootstrap();
