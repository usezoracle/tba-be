import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { CommentsService } from './services/comments.service';
import { PrismaModule } from '../infrastructure/database';
import { RedisModule } from '../infrastructure/redis';
import { LoggingModule } from '../infrastructure/logging';
import { EventBusModule } from '../infrastructure/events';
import { CommentsController } from './comments.controller';

@Module({
  imports: [ConfigModule, PrismaModule, RedisModule, LoggingModule, EventBusModule],
  controllers: [CommentsController],
  providers: [CommentsService],
  exports: [CommentsService],
})
export class CommentsModule {}


