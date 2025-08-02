import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { ThrottlerModule } from '@nestjs/throttler';
import { APP_FILTER, APP_INTERCEPTOR } from '@nestjs/core';

import { AppController } from './app.controller';
import { AppService } from './app.service';
import { TokensModule } from './modules/tokens/tokens.module';
// Health is now part of InfrastructureModule
import { BlockchainModule } from './modules/blockchain/blockchain.module';
// Redis is now part of InfrastructureModule
import { INFRASTRUCTURE_MODULES } from './modules/infrastructure';
import { configValidationSchema } from './config/config.validation';

// Note: Old infrastructure modules removed - now using new infrastructure structure

// Common
import { HttpExceptionsFilter, TransformResponseInterceptor } from './common';

@Module({
  imports: [
    // Configuration
    ConfigModule.forRoot({
      isGlobal: true,
      validationSchema: configValidationSchema,
      envFilePath: ['.env.local', '.env'],
    }),

    // Note: Old infrastructure modules removed

    // Scheduling for cron jobs
    ScheduleModule.forRoot(),

    // Rate limiting
    ThrottlerModule.forRoot([
      {
        ttl: 60000, // 1 minute
        limit: 100, // 100 requests per minute
      },
    ]),

    // Infrastructure modules
    ...INFRASTRUCTURE_MODULES,

    // Feature modules
    TokensModule,
    BlockchainModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    // Global exception filter
    {
      provide: APP_FILTER,
      useClass: HttpExceptionsFilter,
    },
    // Global response transformer
    {
      provide: APP_INTERCEPTOR,
      useClass: TransformResponseInterceptor,
    },
  ],
})
export class AppModule {}