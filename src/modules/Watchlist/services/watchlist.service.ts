import { Injectable } from '@nestjs/common';
import { PinoLogger } from 'nestjs-pino';
import { PrismaService } from '../../infrastructure/database';
import { RedisService } from '../../infrastructure/redis/redis.service';
import { EventBusService } from '../../infrastructure/events/bus/event-bus.service';
import { AddToWatchlistDto, RemoveFromWatchlistDto, GetWatchlistDto } from '../dto';

export interface WatchlistItem {
  id: string;
  userId: string;
  tokenAddress: string;
  createdAt: Date;
  updatedAt: Date;
  user?: {
    id: string;
    walletAddress: string;
  };
}

export interface PaginatedWatchlistResponse {
  success: boolean;
  data: WatchlistItem[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

@Injectable()
export class WatchlistService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
    private readonly eventBus: EventBusService,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(WatchlistService.name);
  }

  private getWatchlistKey(walletAddress: string): string {
    return `watchlist:${walletAddress.toLowerCase()}`;
  }

  private getWatchlistChannel(walletAddress: string): string {
    return `watchlist:${walletAddress.toLowerCase()}:updates`;
  }

  async addToWatchlist(dto: AddToWatchlistDto): Promise<{ success: boolean; message: string; addedCount: number }> {
    try {
      // Find or create user
      let user = await (this.prisma as any).user.findUnique({
        where: { walletAddress: dto.walletAddress.toLowerCase() },
        select: { id: true, walletAddress: true },
      });

      if (!user) {
        // Create user if they don't exist - this must be atomic
        user = await (this.prisma as any).user.create({
          data: {
            walletAddress: dto.walletAddress.toLowerCase(),
          },
          select: { id: true, walletAddress: true },
        });

        this.logger.info(`Created new user for watchlist: ${dto.walletAddress}`);
      }

      // Check which tokens are already in watchlist
      const existingItems = await (this.prisma as any).tokenWatchlist.findMany({
        where: {
          userId: user.id,
          tokenAddress: {
            in: dto.tokenAddresses.map(addr => addr.toLowerCase()),
          },
        },
        select: { tokenAddress: true },
      });

      const existingAddresses = existingItems.map(item => item.tokenAddress);
      const newAddresses = dto.tokenAddresses.filter(
        addr => !existingAddresses.includes(addr.toLowerCase())
      );

      if (newAddresses.length === 0) {
        return {
          success: true,
          message: 'All tokens are already in your watchlist',
          addedCount: 0,
        };
      }

      // Add new tokens to watchlist
      const watchlistItems = await Promise.all(
        newAddresses.map(async (tokenAddress) => {
          return (this.prisma as any).tokenWatchlist.create({
            data: {
              userId: user.id,
              tokenAddress: tokenAddress.toLowerCase(),
            },
            include: {
              user: {
                select: { id: true, walletAddress: true },
              },
            },
          });
        })
      );

      // Update Redis cache
      const watchlistKey = this.getWatchlistKey(dto.walletAddress);
      const pipeline = this.redis.getClient().multi();
      
      for (const item of watchlistItems) {
        pipeline.sadd(watchlistKey, item.tokenAddress);
      }
      
      await pipeline.exec();

      // Publish event for async processing
      this.eventBus.publish({
        eventName: 'user.watchlist.token.added',
        aggregateId: user.id,
        userId: user.id,
        tokenAddresses: newAddresses,
        timestamp: new Date().toISOString(),
      });

      this.logger.info(`Added ${newAddresses.length} tokens to watchlist for user: ${dto.walletAddress}`);

      return {
        success: true,
        message: `Successfully added ${newAddresses.length} tokens to watchlist`,
        addedCount: newAddresses.length,
      };
    } catch (error) {
      this.logger.error('Failed to add tokens to watchlist', error);
      throw new Error('Failed to add tokens to watchlist');
    }
  }

  async removeFromWatchlist(dto: RemoveFromWatchlistDto): Promise<{ success: boolean; message: string; removedCount: number }> {
    try {
      // Find user
      const user = await (this.prisma as any).user.findUnique({
        where: { walletAddress: dto.walletAddress.toLowerCase() },
        select: { id: true, walletAddress: true },
      });

      if (!user) {
        throw new Error('User not found');
      }

      // Remove tokens from watchlist
      const result = await (this.prisma as any).tokenWatchlist.deleteMany({
        where: {
          userId: user.id,
          tokenAddress: {
            in: dto.tokenAddresses.map(addr => addr.toLowerCase()),
          },
        },
      });

      if (result.count === 0) {
        return {
          success: true,
          message: 'No tokens were found in your watchlist',
          removedCount: 0,
        };
      }

      // Update Redis cache
      const watchlistKey = this.getWatchlistKey(dto.walletAddress);
      const pipeline = this.redis.getClient().multi();
      
      for (const tokenAddress of dto.tokenAddresses) {
        pipeline.srem(watchlistKey, tokenAddress.toLowerCase());
      }
      
      await pipeline.exec();

      // Publish event for async processing
      this.eventBus.publish({
        eventName: 'user.watchlist.token.removed',
        aggregateId: user.id,
        userId: user.id,
        tokenAddresses: dto.tokenAddresses,
        timestamp: new Date().toISOString(),
      });

      this.logger.info(`Removed ${result.count} tokens from watchlist for user: ${dto.walletAddress}`);

      return {
        success: true,
        message: `Successfully removed ${result.count} tokens from watchlist`,
        removedCount: result.count,
      };
    } catch (error) {
      this.logger.error('Failed to remove tokens from watchlist', error);
      throw new Error('Failed to remove tokens from watchlist');
    }
  }

  async getWatchlist(dto: GetWatchlistDto): Promise<PaginatedWatchlistResponse> {
    try {
      // Find user
      const user = await (this.prisma as any).user.findUnique({
        where: { walletAddress: dto.walletAddress.toLowerCase() },
        select: { id: true, walletAddress: true },
      });

      if (!user) {
        throw new Error('User not found');
      }

      // Get total count
      const total = await (this.prisma as any).tokenWatchlist.count({
        where: { userId: user.id },
      });

      if (total === 0) {
        return {
          success: true,
          data: [],
          total: 0,
          page: dto.page,
          limit: dto.limit,
          totalPages: 0,
        };
      }

      // Calculate pagination
      const totalPages = Math.ceil(total / dto.limit);
      const skip = (dto.page - 1) * dto.limit;

      // Get paginated watchlist items
      const items = await (this.prisma as any).tokenWatchlist.findMany({
        where: { userId: user.id },
        orderBy: { createdAt: 'desc' },
        skip,
        take: dto.limit,
        include: {
          user: {
            select: { id: true, walletAddress: true },
          },
        },
      });

      return {
        success: true,
        data: items,
        total,
        page: dto.page,
        limit: dto.limit,
        totalPages,
      };
    } catch (error) {
      this.logger.error('Failed to get watchlist', error);
      throw new Error('Failed to get watchlist');
    }
  }

  async isTokenInWatchlist(walletAddress: string, tokenAddress: string): Promise<boolean> {
    try {
      const user = await (this.prisma as any).user.findUnique({
        where: { walletAddress: walletAddress.toLowerCase() },
        select: { id: true },
      });

      if (!user) {
        return false;
      }

      const exists = await (this.prisma as any).tokenWatchlist.findFirst({
        where: {
          userId: user.id,
          tokenAddress: tokenAddress.toLowerCase(),
        },
      });

      return !!exists;
    } catch (error) {
      this.logger.error('Failed to check if token is in watchlist', error);
      return false;
    }
  }

  async getWatchlistCount(walletAddress: string): Promise<number> {
    try {
      const user = await (this.prisma as any).user.findUnique({
        where: { walletAddress: walletAddress.toLowerCase() },
        select: { id: true },
      });

      if (!user) {
        return 0;
      }

      return await (this.prisma as any).tokenWatchlist.count({
        where: { userId: user.id },
      });
    } catch (error) {
      this.logger.error('Failed to get watchlist count', error);
      return 0;
    }
  }
}
