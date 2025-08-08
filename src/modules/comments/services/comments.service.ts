import { Injectable } from '@nestjs/common';
import { PinoLogger } from 'nestjs-pino';
import { PrismaService } from '../../infrastructure/database';
import { RedisService } from '../../infrastructure/redis/redis.service';
import { EventBusService } from '../../infrastructure/events/bus/event-bus.service';
import { CommentCreatedEvent } from '../../infrastructure/events/definitions/comment-created.event';

export interface CreateCommentDto {
  tokenAddress: string;
  walletAddress: string;
  content: string;
}

@Injectable()
export class CommentsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
    private readonly eventBus: EventBusService,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(CommentsService.name);
  }

  private getListKey(tokenAddress: string) {
    return `comments:${tokenAddress.toLowerCase()}:list`;
  }

  private getChannel(tokenAddress: string) {
    return `comments:${tokenAddress.toLowerCase()}`;
  }

  async create(dto: CreateCommentDto) {
    // Basic wallet format validation (0x + 40 hex)
    if (!/^0x[a-fA-F0-9]{40}$/.test(dto.walletAddress)) {
      throw new Error('Invalid wallet address format');
    }

    // Find user by wallet
    const user = await (this.prisma as any).user.findUnique({
      where: { walletAddress: dto.walletAddress.toLowerCase() },
      select: { id: true, walletAddress: true },
    });
    if (!user) {
      throw new Error('User not found');
    }

    // Publish event for async processing (non-blocking)
    const event = new CommentCreatedEvent(
      `comment_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      dto.tokenAddress,
      dto.walletAddress,
      dto.content,
      user.id,
    );

    this.eventBus.publish(event);

    // Return immediate response (event will be processed asynchronously)
    return {
      id: event.aggregateId,
      content: dto.content,
      tokenAddress: dto.tokenAddress.toLowerCase(),
      userId: user.id,
      user: { id: user.id, walletAddress: user.walletAddress },
      createdAt: new Date(),
      status: 'processing',
    };
  }

  async getLatest(tokenAddress: string, limit = 30) {
    const listKey = this.getListKey(tokenAddress);
    try {
      const raw = await this.redis.lrange(listKey, 0, Math.max(0, limit - 1));
      if (raw.length > 0) {
        const parsed = raw
          .map((s) => {
            try {
              return JSON.parse(s);
            } catch (e) {
              return null;
            }
          })
          .filter(Boolean);
        return parsed as any[];
      }
    } catch (error) {
      this.logger.error('Failed reading comments from Redis, will fallback to DB', error);
    }

    // Fallback to DB and warm Redis
    const comments = await (this.prisma as any).comment.findMany({
      where: { tokenAddress: tokenAddress.toLowerCase() },
      orderBy: { createdAt: 'desc' },
      take: limit,
      include: {
        user: { select: { id: true, walletAddress: true } },
      },
    });

    // Warm Redis list maintaining newest-first (LPUSH from oldest to newest)
    try {
      const client = this.redis.getClient();
      const pipeline = client.multi();
      for (let i = comments.length - 1; i >= 0; i -= 1) {
        pipeline.lpush(listKey, JSON.stringify(comments[i]));
      }
      pipeline.ltrim(listKey, 0, 29);
      await pipeline.exec();
    } catch (error) {
      this.logger.error('Failed to warm Redis comments list from DB', error);
    }

    return comments;
  }
}


