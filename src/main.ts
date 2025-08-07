import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
import { Logger } from 'nestjs-pino';
import { AppModule } from './app.module';
import { GracefulShutdownUtil } from './modules/infrastructure/logging/utils/graceful-shutdown.util';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { bufferLogs: true });

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

  // CORS
  app.enableCors({
    origin: configService.get('CORS_ORIGINS')?.split(',') || '*',
    credentials: true,
  });

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
      .addServer('http://localhost:3000', 'Development server')
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
