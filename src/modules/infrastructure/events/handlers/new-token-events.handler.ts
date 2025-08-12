import { Injectable, OnModuleInit } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { PinoLogger } from 'nestjs-pino';
import { RedisService } from '../../redis/redis.service';
import { NewTokenCreatedEvent } from '../../../NewTokens/providers/interfaces';

@Injectable()
export class NewTokenEventsHandler implements OnModuleInit {
  constructor(
    private readonly logger: PinoLogger,
    private readonly eventEmitter: EventEmitter2,
    private readonly redisService: RedisService,
  ) {
    this.logger.setContext(NewTokenEventsHandler.name);
  }

  onModuleInit() {
    // Register event handlers
    this.eventEmitter.on('new-token-created', this.handleNewTokenCreated.bind(this));
  }

  private async handleNewTokenCreated(event: NewTokenCreatedEvent) {
    try {
      const hashKey = `new-tokens:events`;
      const listKey = `new-tokens:list`;
      const channel = `new-tokens:updates`;

      const tokenData = {
        name: event.name,
        symbol: event.symbol,
        address: event.address,
        network: event.network,
        protocol: event.protocol,
        networkId: event.networkId,
        createdAt: event.createdAt,
        priceUSD: event.priceUSD,
        marketCap: event.marketCap,
        volume24: event.volume24,
        holders: event.holders,
        imageLargeUrl: event.imageLargeUrl,
        graduationPercent: event.graduationPercent,
        launchpadProtocol: event.launchpadProtocol,
        timestamp: event.timestamp,
      };

      // Deduplicate using hash
      const eventKey = event.address; // Use address as the unique identifier
      const exists = await this.redisService.hexists(hashKey, eventKey);
      if (!exists) {
        // Use Redis multi/exec to pipeline writes
        const client = this.redisService.getClient();
        const pipeline = client.multi();
        pipeline.hset(hashKey, eventKey, JSON.stringify(tokenData));
        pipeline.expire(hashKey, 86400);
        pipeline.lpush(listKey, JSON.stringify(tokenData));
        pipeline.ltrim(listKey, 0, 199);
        pipeline.expire(listKey, 86400);
        pipeline.publish(channel, JSON.stringify(tokenData));
        await pipeline.exec();

        this.logger.info(`Token saved to Redis: ${eventKey}`);
      }
    } catch (error) {
      this.logger.error(`Failed to save token to Redis: ${event.address}`, error);
    }
  }
}
