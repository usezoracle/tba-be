import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PinoLogger } from 'nestjs-pino';
import { PrismaService } from '../../infrastructure/database/prisma';
import { RedisService } from '../../infrastructure/redis';
import { EventBusService } from '../../infrastructure/events';
import { calculatePagination, validatePaginationParams } from '../../../shared/utils';
import {
  AddToWatchlistParams,
  RemoveFromWatchlistParams,
  GetWatchlistParams,
  AddToWatchlistResponse,
  RemoveFromWatchlistResponse,
  PaginatedWatchlistResponse,
} from '../interfaces/watchlist.interfaces';

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

  async addToWatchlist(params: AddToWatchlistParams): Promise<AddToWatchlistResponse> {
    try {
      // Normalize addresses once at the start
      const walletAddress = params.walletAddress.toLowerCase();
      const tokenAddresses = params.tokenAddresses.map(a => a.toLowerCase());

      // Use upsert to avoid duplicate DB calls and race conditions
      const user = await this.prisma.user.upsert({
        where: { walletAddress },
        create: { walletAddress },
        update: {},
        select: { id: true, walletAddress: true },
      });

      // Check which tokens are already in watchlist
      const existingItems = await this.prisma.tokenWatchlist.findMany({
        where: {
          userId: user.id,
          tokenAddress: {
            in: tokenAddresses,
          },
        },
        select: { tokenAddress: true },
      });

      // Use Set for O(1) lookup instead of O(N²) array filtering
      const existingSet = new Set(existingItems.map(item => item.tokenAddress));
      const newAddresses = tokenAddresses.filter(addr => !existingSet.has(addr));

      if (newAddresses.length === 0) {
        return {
          data: { addedCount: 0 },
        };
      }

      // Batch insert instead of individual Promise.all calls
      await this.prisma.tokenWatchlist.createMany({
        data: newAddresses.map(tokenAddress => ({
          userId: user.id,
          tokenAddress,
        })),
        skipDuplicates: true, // ensures no race-condition duplicates
      });

      // Update Redis cache
      const watchlistKey = this.getWatchlistKey(walletAddress);
      const pipeline = this.redis.getClient().multi();
      
      for (const tokenAddress of newAddresses) {
        pipeline.sadd(watchlistKey, tokenAddress);
      }

      // Parallelize independent I/O operations
      await Promise.all([
        pipeline.exec(),
        this.eventBus.publish({
          eventName: 'user.watchlist.token.added',
          aggregateId: user.id,
          userId: user.id,
          tokenAddresses: newAddresses,
          timestamp: new Date().toISOString(),
        }),
      ]);

      // Improved logging with structured data
      this.logger.info('Added tokens to watchlist', {
        user: walletAddress,
        addedCount: newAddresses.length,
        tokens: newAddresses.slice(0, 5), // Show first 5 tokens for debugging
      });

      return {
        data: { addedCount: newAddresses.length },
      };
    } catch (error) {
      const errorDetails = error as Error;

      this.logger.error('Failed to add tokens to watchlist', {
        error: errorDetails.message,
        stack: errorDetails.stack,
        name: errorDetails.name,
        code: (errorDetails as any).code
      });
      throw new BadRequestException(`Failed to add tokens to watchlist: ${errorDetails.message}`);
    }
  }

  async removeFromWatchlist(params: RemoveFromWatchlistParams): Promise<RemoveFromWatchlistResponse> {
    try {
      // Normalize addresses once at the start
      const walletAddress = params.walletAddress.toLowerCase();
      const tokenAddresses = params.tokenAddresses.map(addr => addr.toLowerCase());

      // Find user
      const user = await this.prisma.user.findUnique({
        where: { walletAddress },
        select: { id: true, walletAddress: true },
      });

      if (!user) {
        throw new NotFoundException('User not found');
      }

      // Remove tokens from watchlist
      const result = await this.prisma.tokenWatchlist.deleteMany({
        where: {
          userId: user.id,
          tokenAddress: {
            in: tokenAddresses,
          },
        },
      });

      if (result.count === 0) {
        return {
          data: { removedCount: 0 },
        };
      }

      // Update Redis cache
      const watchlistKey = this.getWatchlistKey(walletAddress);
      const pipeline = this.redis.getClient().multi();
      
      for (const tokenAddress of tokenAddresses) {
        pipeline.srem(watchlistKey, tokenAddress);
      }

      // Parallelize independent I/O operations
      await Promise.all([
        pipeline.exec(),
        this.eventBus.publish({
          eventName: 'user.watchlist.token.removed',
          aggregateId: user.id,
          userId: user.id,
          tokenAddresses: params.tokenAddresses, // Keep original case for event
          timestamp: new Date().toISOString(),
        }),
      ]);

      // Improved logging with structured data
      this.logger.info('Removed tokens from watchlist', {
        user: walletAddress,
        removedCount: result.count,
        tokens: tokenAddresses.slice(0, 5), // Show first 5 tokens for debugging
      });

      return {
        data: { removedCount: result.count },
      };
    } catch (error) {
      this.logger.error('Failed to remove tokens from watchlist', error);

      // If it's already an HTTP exception, re-throw it
      if (error instanceof NotFoundException) {
        throw error;
      }

      // For other errors, throw a BadRequestException
      throw new BadRequestException('Failed to remove tokens from watchlist');
    }
  }

  async getWatchlist(params: GetWatchlistParams): Promise<PaginatedWatchlistResponse> {
    try {
      // Normalize wallet address once at the start
      const walletAddress = params.walletAddress.toLowerCase();
      const { page, limit } = validatePaginationParams(params.page || 1, params.limit || 20);

      // Find user
      const user = await this.prisma.user.findUnique({
        where: { walletAddress },
        select: { id: true, walletAddress: true },
      });

      if (!user) {
        throw new NotFoundException('User not found');
      }

      // Get total count and paginated items in parallel for better performance
      const [total, items] = await Promise.all([
        this.prisma.tokenWatchlist.count({
          where: { userId: user.id },
        }),
        this.prisma.tokenWatchlist.findMany({
          where: { userId: user.id },
          orderBy: { createdAt: 'desc' },
          skip: (page - 1) * limit,
          take: limit,
          include: {
            user: {
              select: { id: true, walletAddress: true },
            },
          },
        }),
      ]);

      if (total === 0) {
        return {
          data: [],
          pagination: calculatePagination({ page, limit }, 0),
        };
      }

      return {
        data: items,
        pagination: calculatePagination({ page, limit }, total),
      };
    } catch (error) {
      this.logger.error('Failed to get watchlist', error);

      // If it's already an HTTP exception, re-throw it
      if (error instanceof NotFoundException) {
        throw error;
      }

      // For other errors, throw a BadRequestException
      throw new BadRequestException('Failed to get watchlist');
    }
  }

  async isTokenInWatchlist(walletAddress: string, tokenAddress: string): Promise<boolean> {
    try {
      // Normalize addresses once at the start
      const normalizedWalletAddress = walletAddress.toLowerCase();
      const normalizedTokenAddress = tokenAddress.toLowerCase();

      const user = await this.prisma.user.findUnique({
        where: { walletAddress: normalizedWalletAddress },
        select: { id: true },
      });

      if (!user) {
        return false;
      }

      const exists = await this.prisma.tokenWatchlist.findFirst({
        where: {
          userId: user.id,
          tokenAddress: normalizedTokenAddress,
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
      // Normalize wallet address once at the start
      const normalizedWalletAddress = walletAddress.toLowerCase();

      const user = await this.prisma.user.findUnique({
        where: { walletAddress: normalizedWalletAddress },
        select: { id: true },
      });

      if (!user) {
        return 0;
      }

      return await this.prisma.tokenWatchlist.count({
        where: { userId: user.id },
      });
    } catch (error) {
      this.logger.error('Failed to get watchlist count', error);
      return 0;
    }
  }
}
