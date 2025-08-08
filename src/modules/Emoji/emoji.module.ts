import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { EmojiController } from './emoji.controller';
import { EmojiService } from './services/emoji.service';
import { PrismaModule } from '../infrastructure/database';
import { RedisModule } from '../infrastructure/redis';
import { LoggingModule } from '../infrastructure/logging';
import { EventBusModule } from '../infrastructure/events';

@Module({
  imports: [ConfigModule, PrismaModule, RedisModule, LoggingModule, EventBusModule],
  controllers: [EmojiController],
  providers: [EmojiService],
  exports: [EmojiService],
})
export class EmojiModule {}
