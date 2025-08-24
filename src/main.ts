import { NestFactory } from '@nestjs/core';
import { ValidationPipe, BadRequestException } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
import { Logger } from 'nestjs-pino';
import { AppModule } from './app.module';
import { GracefulShutdownUtil } from './modules/infrastructure/logging/utils/graceful-shutdown.util';
import { PrismaService } from './modules/infrastructure/database/prisma/prisma.service';
import { RedisService } from './modules/infrastructure/redis/redis.service';

async function bootstrap() {
  // CORS configuration: hardcoded origins for Zoracle domains
  const configuredOriginsList = [
    'https://usezoracle.xyz',
    'https://zoracle.xyz',
    'https://v2.usezoracle.xyz',
    'https://v2.zoracle.xyz',
    'http://localhost:3000'
  ];

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
        return new BadRequestException(`Validation failed: ${messages.join('; ')}`);
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

  // Ensure critical infra is up before starting HTTP server
  try {
    const prisma = app.get(PrismaService);
    const redis = app.get(RedisService);

    // Database connectivity with retry logic
    if (prisma && typeof prisma.$connect === 'function') {
      let dbConnected = false;
      let retryCount = 0;
      const maxRetries = 3;
      
      while (!dbConnected && retryCount < maxRetries) {
        try {
                    await prisma.$connect();
          dbConnected = true;
          logger.log(`✅ Database connected successfully (attempt ${retryCount + 1})`);
        } catch (dbError) {
          retryCount++;
          logger.warn(`⚠️ Database connection attempt ${retryCount} failed, retrying...`, dbError);

          if (retryCount >= maxRetries) {
            logger.error('❌ Max database connection retries exceeded');
            throw dbError;
          }

          // Wait before retrying (exponential backoff)
          await new Promise(resolve => setTimeout(resolve, Math.pow(2, retryCount) * 1000));
        }
      }
    }

    // Redis connectivity with retry logic
    if (redis && typeof redis.ping === 'function') {
      let redisConnected = false;
      let retryCount = 0;
      const maxRetries = 3;
      
      while (!redisConnected && retryCount < maxRetries) {
        try {
          await redis.ping();
          redisConnected = true;
          logger.log(`✅ Redis connected successfully (attempt ${retryCount + 1})`);
        } catch (redisError) {
          retryCount++;
          logger.warn(`⚠️ Redis connection attempt ${retryCount} failed, retrying...`, redisError);
          
          if (retryCount >= maxRetries) {
            logger.error('❌ Max Redis connection retries exceeded');
            throw redisError;
          }
          
          // Wait before retrying (exponential backoff)
          await new Promise(resolve => setTimeout(resolve, Math.pow(2, retryCount) * 1000));
        }
      }
    }
  } catch (e) {
    const logger = app.get(Logger);
    logger.error('Startup checks failed. Ensure database and Redis are reachable.', e);
    // Exit non-zero so process managers can restart
    // eslint-disable-next-line no-process-exit
    process.exit(1);
  }

  await app.listen(port);

  logger.log(`🚀 Application is running on: http://localhost:${port}`);
  logger.log(`📚 Swagger docs available at: http://localhost:${port}/api/docs`);
  logger.log(`✨ Standardized API responses enabled`);
}

bootstrap();
