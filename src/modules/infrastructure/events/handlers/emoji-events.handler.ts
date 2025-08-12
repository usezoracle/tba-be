import { Injectable, OnModuleInit } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { PinoLogger } from 'nestjs-pino';
import { RedisService } from '../../redis/redis.service';
import { EmojiReactedEvent } from '../definitions/emoji-reacted.event';

@Injectable()
export class EmojiEventsHandler implements OnModuleInit {
  constructor(
    private readonly logger: PinoLogger,
    private readonly eventEmitter: EventEmitter2,
    private readonly redisService: RedisService,
  ) {
    this.logger.setContext(EmojiEventsHandler.name);
  }

  onModuleInit() {
    this.eventEmitter.on('emoji.reacted', this.handleEmojiReacted.bind(this));
  }

  private async handleEmojiReacted(event: EmojiReactedEvent) {
    try {
      const hashKey = `emoji:${event.tokenAddress.toLowerCase()}`;
      const channel = `emojiUpdates:${event.tokenAddress.toLowerCase()}`;
      const lockKey = `lock:${hashKey}:${event.emoji}`;

      const client = this.redisService.getClient();

      // Use Redis transaction with optimistic locking
      const result = await client
        .multi()
        // 1. Get current count for validation
        .hget(hashKey, event.emoji)
        // 2. Increment atomically
        .hincrby(hashKey, event.emoji, event.increment)
        // 3. Get all counts after increment
        .hgetall(hashKey)
        .exec();

      // Get the previous count and new count
      const previousCount = parseInt(result[0][1] as string || '0', 10);
      const newCount = parseInt(result[1][1] as string || '0', 10);
      const allCounts = result[2][1] as Record<string, string>;

      // Validate the increment
      if (newCount < previousCount) {
        this.logger.warn(`Invalid count detected: ${previousCount} -> ${newCount} for ${event.emoji}`);
        // Revert to previous count
        await client
          .multi()
          .hset(hashKey, event.emoji, previousCount.toString())
          .exec();
        return;
      }

      // Ensure all emoji fields exist with at least 0
      const normalizedCounts = {
        like: '0',
        love: '0',
        laugh: '0',
        wow: '0',
        sad: '0',
        ...allCounts
      };

      // Publish updated counts with previous and new values for verification
      await this.redisService.publish(channel, JSON.stringify({
        type: 'emojiCountUpdate',
        counts: normalizedCounts,
        emoji: event.emoji,
        previousCount: previousCount.toString(),
        newCount: newCount.toString(),
        timestamp: Date.now()
      }));

      this.logger.info(`Emoji reaction processed: ${event.emoji} for token: ${event.tokenAddress} (${previousCount} -> ${newCount})`);
    } catch (error) {
      this.logger.error(`Failed to process emoji reaction: ${event.aggregateId}`, error);
    }
  }
}