import { Injectable } from '@nestjs/common';
import { PinoLogger } from 'nestjs-pino';
import { PrismaService } from '../../infrastructure/database';
import { RedisService } from '../../infrastructure/redis/redis.service';
import { EventBusService } from '../../infrastructure/events/bus/event-bus.service';
import { CommentCreatedEvent } from '../../infrastructure/events/definitions/comment-created.event';
import { PrismaClient } from '@prisma/client';
import { CreateCommentParams, CreateCommentResult } from '../interfaces/comments.interfaces';

@Injectable()
export class CommentsService {
  private readonly prismaClient: PrismaClient;

  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
    private readonly eventBus: EventBusService,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(CommentsService.name);
    this.prismaClient = this.prisma as PrismaClient;
  }

  private getListKey(tokenAddress: string) {
    return `comments:${tokenAddress.toLowerCase()}:list`;
  }

  private getChannel(tokenAddress: string) {
    return `comments:${tokenAddress.toLowerCase()}`;
  }

  async create(params: CreateCommentParams): Promise<CreateCommentResult> {
    // Basic wallet format validation (0x + 40 hex)
    if (!/^0x[a-fA-F0-9]{40}$/.test(params.walletAddress)) {
      throw new Error('Invalid wallet address format');
    }

    // Find or create user by wallet
    let user;
    try {
      user = await this.prismaClient.user.findUnique({
        where: { walletAddress: params.walletAddress.toLowerCase() },
        select: { id: true, walletAddress: true },
      });

      if (!user) {
        // Create user if they don't exist - this must be atomic
        user = await this.prismaClient.user.create({
          data: {
            walletAddress: params.walletAddress.toLowerCase(),
          },
          select: { id: true, walletAddress: true },
        });

        this.logger.info(`Created new user for wallet: ${params.walletAddress}`);
      }
    } catch (dbError) {
      this.logger.error('Database connection failed', dbError);
      throw new Error('Database connection failed. Please try again later.');
    }

    // Publish event for async processing (non-blocking)
    const event = new CommentCreatedEvent(
      `comment_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      params.tokenAddress,
      params.walletAddress,
      params.content,
      user.id,
    );

    this.eventBus.publish(event);

    // Return immediate response (event will be processed asynchronously)
    return {
      id: event.aggregateId,
      content: params.content,
      tokenAddress: params.tokenAddress.toLowerCase(),
      userId: user.id,
      user: { id: user.id, walletAddress: user.walletAddress },
      createdAt: new Date(),
      status: 'processing',
    };
  }

  async getLatest(tokenAddress: string, limit = 50) {
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
    try {
      const comments = await this.prismaClient.comment.findMany({
        where: { tokenAddress: tokenAddress.toLowerCase() },
        orderBy: { createdAt: 'desc' },
        take: limit,
        include: {
          user: { select: { id: true, walletAddress: true } },
        },
      });

      // Warm Redis list maintaining newest-first (LPUSH from oldest to newest)
      try {
        for (let i = comments.length - 1; i >= 0; i -= 1) {
          await this.redis.lpush(listKey, JSON.stringify(comments[i]));
        }
        await this.redis.ltrim(listKey, 0, 49);
      } catch (error) {
        this.logger.error('Failed to warm Redis comments list from DB', error);
      }

      return comments;
    } catch (error) {
      this.logger.error('Failed to get comments from database', error);
      return [];
    }
  }
}


