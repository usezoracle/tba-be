import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
import { Logger } from 'nestjs-pino';
import { AppModule } from './app.module';
import { GracefulShutdownUtil } from './modules/infrastructure/logging/utils/graceful-shutdown.util';

async function bootstrap() {
  // CORS configuration: use ONLY the origins provided via env (comma-separated)
  const configuredOriginsEnv = process.env.CORS_ORIGINS;
  const configuredOriginsList = (configuredOriginsEnv || '')
    .split(',')
    .map((o) => o.trim())
    .filter(Boolean);

  const app = await NestFactory.create(AppModule, {
    bufferLogs: true,
    cors: {
      origin: configuredOriginsList,
      credentials: true,
      methods: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE', 'OPTIONS'],
      allowedHeaders: [
        'Content-Type',
        'Authorization',
        'Origin',
        'X-Requested-With',
        'Cache-Control',
        'ngrok-skip-browser-warning',
      ],
      optionsSuccessStatus: 204,
    },
  });

  // Use Pino logger
  app.useLogger(app.get(Logger));

  const configService = app.get(ConfigService);
  const logger = app.get(Logger);

  // Global prefix
  app.setGlobalPrefix('api/v1');

  // Global validation pipe with standardized settings
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
      // Return detailed validation errors
      exceptionFactory: (errors) => {
        const messages = errors.map((error) =>
          Object.values(error.constraints || {}).join(', '),
        );
        return new Error(`Validation failed: ${messages.join('; ')}`);
      },
    }),
  );

  // Global filters and interceptors are now configured in app.module.ts

  // Remove later CORS setup; using bootstrap cors ensures preflight handled before routes

  // Swagger documentation with standardized response examples
  if (configService.get('NODE_ENV') !== 'production') {
    const config = new DocumentBuilder()
      .setTitle('Zora TBA Coins API')
      .setDescription(
        'API for scanning and retrieving Zora and TBA token data with standardized responses',
      )
      .setVersion('1.0')
      .addTag('tokens', 'Token-related endpoints')
      .addTag('health', 'Health check endpoints')
      .addTag('app', 'Application information')
      // Relative server first to work with any host (e.g., ngrok) and avoid CORS
      .addServer('/', 'Current host')
      .addServer('http://localhost:3000', 'Local development')
      .build();

    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('api/docs', app, document);
  }

  const port = configService.get('PORT') || 3000;

  // Setup graceful shutdown
  GracefulShutdownUtil.setLogger(logger);
  GracefulShutdownUtil.setupGracefulShutdown(app);

  await app.listen(port);

  logger.log(`🚀 Application is running on: http://localhost:${port}`);
  logger.log(`📚 Swagger docs available at: http://localhost:${port}/api/docs`);
  logger.log(`✨ Standardized API responses enabled`);
}

bootstrap();
