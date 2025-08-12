import { Injectable } from '@nestjs/common';
import { PinoLogger } from 'nestjs-pino';
import { RedisService } from '../../infrastructure/redis/redis.service';
import { NewTokenCreatedEvent } from '../providers/interfaces';

export interface TokenData {
  name: string;
  symbol: string;
  address: string;
  network: string;
  protocol: string;
  networkId: number;
  createdAt: string;
  priceUSD?: number;
  marketCap?: number;
  volume24?: number;
  holders?: number;
  imageLargeUrl?: string;
  graduationPercent?: number;
  launchpadProtocol?: string;
  timestamp: string;
}

export interface PaginatedTokensResponse {
  success: boolean;
  data: TokenData[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

@Injectable()
export class NewTokensService {
  private readonly hashKey = 'new-tokens:events';
  private readonly listKey = 'new-tokens:list';
  private readonly channel = 'new-tokens:updates';
  
  // In-memory fanout for SSE subscribers
  private readonly sseSubscribers = new Set<(token: TokenData) => void>();
  private isRedisSubscribed = false;

  constructor(
    private readonly redisService: RedisService,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(NewTokensService.name);
  }

  /**
   * Get latest tokens with pagination
   */
  async getLatestTokens(page: number = 1, limit: number = 30, offset?: number): Promise<PaginatedTokensResponse> {
    try {
      // Validate parameters
      const validatedPage = Math.max(1, page);
      const validatedLimit = Math.min(100, Math.max(1, limit));

      // Calculate start and stop indices for Redis LRANGE
      const start = typeof offset === 'number' ? offset : (validatedPage - 1) * validatedLimit;
      const stop = start + validatedLimit - 1;

      // Get total count
      const total = await this.redisService.llen(this.listKey);
      
      // Get tokens for the current page
      const tokenStrings = await this.redisService.lrange(this.listKey, start, stop);
      
      // Parse tokens
      const tokens: TokenData[] = tokenStrings
        .map(tokenStr => {
          try {
            return JSON.parse(tokenStr) as TokenData;
          } catch (error) {
            this.logger.error(`Failed to parse token: ${tokenStr}`, error);
            return null;
          }
        })
        .filter(token => token !== null) as TokenData[];

      const totalPages = Math.ceil(total / validatedLimit);

      return {
        success: true,
        data: tokens,
        total,
        page: validatedPage,
        limit: validatedLimit,
        totalPages,
      };
    } catch (error) {
      this.logger.error('Failed to get latest tokens', error);
      return {
        success: false,
        data: [],
        total: 0,
        page,
        limit,
        totalPages: 0,
      };
    }
  }

  /**
   * Get Redis subscriber for SSE
   */
  getRedisSubscriber() {
    return this.redisService.getClient();
  }

  /**
   * Get token updates channel name
   */
  getTokenUpdatesChannel(): string {
    return this.channel;
  }

  /**
   * Get initial snapshot of latest tokens (newest first)
   */
  async getInitialSnapshot(limit: number = 30): Promise<TokenData[]> {
    try {
      const stop = Math.max(0, limit - 1);
      const tokenStrings = await this.redisService.lrange(this.listKey, 0, stop);
      const tokens: TokenData[] = tokenStrings
        .map((tokenStr) => {
          try {
            return JSON.parse(tokenStr) as TokenData;
          } catch (error) {
            this.logger.error(`Failed to parse token: ${tokenStr}`, error);
            return null;
          }
        })
        .filter((token) => token !== null) as TokenData[];
      return tokens;
    } catch (error) {
      this.logger.error('Failed to get initial snapshot', error);
      return [];
    }
  }

  /**
   * Subscribe to token updates
   * @param callback Callback function to handle token updates
   */
  subscribeToTokenUpdates(callback: (tokenData: TokenData) => void): void {
    this.sseSubscribers.add(callback);
    
    if (!this.isRedisSubscribed) {
      this.logger.debug('Subscribing to Redis channel (single subscription)');
      this.redisService.subscribe(this.channel, (message) => {
        try {
          const tokenData = JSON.parse(message) as TokenData;
          // Fan out to in-memory subscribers
          for (const subscriber of this.sseSubscribers) {
            try {
              subscriber(tokenData);
            } catch (err) {
              this.logger.error('SSE subscriber callback failed', err);
            }
          }
        } catch (error) {
          this.logger.error('Failed to parse token update message', error);
        }
      });
      this.isRedisSubscribed = true;
    }
  }

  /**
   * Unsubscribe from token updates
   */
  unsubscribeFromTokenUpdates(callback?: (tokenData: TokenData) => void): void {
    if (callback) {
      this.sseSubscribers.delete(callback);
    } else {
      // Backward compatibility: clear all
      this.sseSubscribers.clear();
    }

    if (this.sseSubscribers.size === 0 && this.isRedisSubscribed) {
      this.logger.debug('No SSE subscribers left, unsubscribing from Redis channel');
      this.redisService.unsubscribe(this.channel);
      this.isRedisSubscribed = false;
    }
  }

  /**
   * Publish token event to Redis channel
   */
  async publishTokenEvent(event: NewTokenCreatedEvent): Promise<void> {
    try {
      const tokenData: TokenData = {
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

      await this.redisService.publish(this.channel, JSON.stringify(tokenData));
      this.logger.debug(`Published token event: ${event.address}`);
    } catch (error) {
      this.logger.error(`Failed to publish token event: ${event.address}`, error);
    }
  }
}
