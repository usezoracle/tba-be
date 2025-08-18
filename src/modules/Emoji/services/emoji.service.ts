import { Injectable, BadRequestException } from '@nestjs/common';
import { PinoLogger } from 'nestjs-pino';
import { RedisService } from '../../infrastructure/redis/redis.service';
import { EventBusService } from '../../infrastructure/events/bus/event-bus.service';
import { EmojiReactedEvent, EmojiType } from '../../infrastructure/events/definitions/emoji-reacted.event';
import { ReactEmojiDto } from '../dto';

@Injectable()
export class EmojiService {
  constructor(
    private readonly redis: RedisService,
    private readonly eventBus: EventBusService,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(EmojiService.name);
  }

  private getHashKey(tokenAddress: string) {
    return `emoji:${tokenAddress.toLowerCase()}`;
  }

  private getChannel(tokenAddress: string) {
    return `emojiUpdates:${tokenAddress.toLowerCase()}`;
  }

  async react(dto: ReactEmojiDto) {
    // Validate emoji type
    if (!['like', 'love', 'laugh', 'wow', 'sad'].includes(dto.emoji)) {
      throw new BadRequestException('Invalid emoji type');
    }

    // Validate increment
    if (![1, 2, 3].includes(dto.increment)) {
      throw new BadRequestException('Invalid increment value');
    }

    // Create and publish event
    const event = new EmojiReactedEvent(
      `emoji_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      dto.tokenAddress,
      dto.emoji,
      dto.increment,
    );

    this.eventBus.publish(event);

    // Return immediate response
    return {
      id: event.aggregateId,
      tokenAddress: dto.tokenAddress.toLowerCase(),
      emoji: dto.emoji,
      increment: dto.increment,
      status: 'processing',
    };
  }

  async getCounts(tokenAddress: string) {
    const hashKey = this.getHashKey(tokenAddress);
    const counts = await this.redis.hgetall(hashKey);

    // Ensure all emoji fields exist with at least 0
    return {
      like: counts.like || '0',
      love: counts.love || '0',
      laugh: counts.laugh || '0',
      wow: counts.wow || '0',
      sad: counts.sad || '0',
    };
  }
}
