import { Injectable, OnModuleInit } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { PinoLogger } from 'nestjs-pino';
import { RedisService } from '../../redis/redis.service';
import { PrismaService } from '../../database';
import { CommentCreatedEvent } from '../definitions/comment-created.event';

@Injectable()
export class CommentEventsHandler implements OnModuleInit {
  constructor(
    private readonly logger: PinoLogger,
    private readonly eventEmitter: EventEmitter2,
    private readonly redisService: RedisService,
    private readonly prismaService: PrismaService,
  ) {
    this.logger.setContext(CommentEventsHandler.name);
  }

  onModuleInit() {
    // Register event handlers
    this.eventEmitter.on('comment.created', this.handleCommentCreated.bind(this));
  }

  private async handleCommentCreated(event: CommentCreatedEvent) {
    try {
      const listKey = `comments:${event.tokenAddress.toLowerCase()}:list`;
      const channel = `comments:${event.tokenAddress.toLowerCase()}`;

      // Create comment in database
      const comment = await (this.prismaService as any).comment.create({
        data: {
          content: event.content,
          tokenAddress: event.tokenAddress.toLowerCase(),
          userId: event.userId,
        },
        include: {
          user: { select: { id: true, walletAddress: true } },
        },
      });

      // Write-through cache: push to Redis list (newest-first) and trim to last 50
      try {
        const client = this.redisService.getClient();
        await client
          .multi()
          .lpush(listKey, JSON.stringify(comment))
          .ltrim(listKey, 0, 49)
          .exec();
      } catch (error) {
        this.logger.error('Failed to update Redis list for comments', error);
      }

      // Publish to Redis for cross-instance broadcast
      try {
        await this.redisService.publish(channel, JSON.stringify({
          type: 'newComment',
          comment,
        }));
      } catch (error) {
        this.logger.error('Failed to publish newComment', error);
      }

      // Ensure database retains only the latest 50 for this token (prune older)
      try {
        const older = await (this.prismaService as any).comment.findMany({
          where: { tokenAddress: event.tokenAddress.toLowerCase() },
          orderBy: { createdAt: 'desc' },
          skip: 50,
          select: { id: true },
        });
        if (older.length > 0) {
          await (this.prismaService as any).comment.deleteMany({
            where: { id: { in: older.map((c: any) => c.id) } },
          });
        }
      } catch (error) {
        this.logger.error('Failed to prune comments beyond latest 30 in DB', error);
      }

      this.logger.info(`Comment created and processed: ${comment.id} for token: ${event.tokenAddress}`);
    } catch (error) {
      this.logger.error(`Failed to process comment created event: ${event.aggregateId}`, error);
    }
  }
}
