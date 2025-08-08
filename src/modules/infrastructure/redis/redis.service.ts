import { Injectable, Inject } from '@nestjs/common';
import { PinoLogger } from 'nestjs-pino';
import { ConfigType } from '@nestjs/config';
import Redis from 'ioredis';
import redisConfig from '../../../config/redis.config';

@Injectable()
export class RedisService {
  private readonly redis: Redis;

  constructor(
    @Inject(redisConfig.KEY)
    private readonly config: ConfigType<typeof redisConfig>,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(RedisService.name);

    // Use ioredis for all Redis operations
    const redisUrl = process.env.UPSTASH_REDIS_URL;
    this.redis = new Redis(redisUrl);
    this.logger.info('Redis client initialized with ioredis');
  }

  /**
   * Build ioredis URL from REST URL and token
   */
  private buildIoredisUrl(): string {
    // Extract host from REST URL: https://host.upstash.io
    const restUrl = this.config.url;
    const host = restUrl.replace('https://', '').replace('.upstash.io', '');
    const token = this.config.token;

    // Build ioredis URL: rediss://default:token@host.upstash.io:6379
    return `rediss://default:${token}@${host}.upstash.io:6379`;
  }

  /**
   * Store data with expiration
   * @param key Redis key
   * @param data Data to store
   * @param ttl Time to live in seconds
   */
  async set<T>(key: string, data: T, ttl?: number): Promise<void> {
    try {
      if (ttl) {
        await this.redis.set(key, JSON.stringify(data), 'EX', ttl);
      } else {
        await this.redis.set(key, JSON.stringify(data));
      }
      this.logger.debug(`Successfully stored data at key: ${key}`);
    } catch (error) {
      this.logger.error(`Failed to store data at key: ${key}`, error);
      throw error;
    }
  }

  /**
   * Get data by key
   * @param key Redis key
   * @returns Parsed data or null if not found
   */
  async get<T>(key: string): Promise<T | null> {
    try {
      const data = await this.redis.get(key);
      if (!data) return null;

      return JSON.parse(data as string) as T;
    } catch (error) {
      this.logger.error(`Failed to get data from key: ${key}`, error);
      return null;
    }
  }

  /**
   * Delete data by key
   * @param key Redis key
   */
  async delete(key: string): Promise<void> {
    try {
      await this.redis.del(key);
      this.logger.debug(`Successfully deleted key: ${key}`);
    } catch (error) {
      this.logger.error(`Failed to delete key: ${key}`, error);
      throw error;
    }
  }

  /**
   * Check if key exists
   * @param key Redis key
   * @returns boolean
   */
  async exists(key: string): Promise<boolean> {
    try {
      return (await this.redis.exists(key)) === 1;
    } catch (error) {
      this.logger.error(`Failed to check existence of key: ${key}`, error);
      return false;
    }
  }

  /**
   * Get TTL for a key
   * @param key Redis key
   * @returns TTL in seconds or -2 if key doesn't exist, -1 if key has no expiry
   */
  async ttl(key: string): Promise<number> {
    try {
      return await this.redis.ttl(key);
    } catch (error) {
      this.logger.error(`Failed to get TTL for key: ${key}`, error);
      return -2;
    }
  }

  /**
   * Store multiple key-value pairs
   * @param entries Array of [key, value] pairs
   */
  async mset(entries: [string, any][]): Promise<void> {
    try {
      const flat: string[] = [];
      for (const [key, value] of entries) {
        flat.push(key, JSON.stringify(value));
      }
      await this.redis.mset(...flat);
      this.logger.debug(
        `Successfully stored ${entries.length} key-value pairs`,
      );
    } catch (error) {
      this.logger.error('Failed to store multiple key-value pairs', error);
      throw error;
    }
  }

  /**
   * Get multiple values by keys
   * @param keys Array of keys
   * @returns Array of parsed values (null for keys that don't exist)
   */
  async mget<T>(keys: string[]): Promise<(T | null)[]> {
    try {
      const values = await this.redis.mget(...keys);
      return values.map((value) =>
        value ? (JSON.parse(value as string) as T) : null,
      );
    } catch (error) {
      this.logger.error('Failed to get multiple values', error);
      return keys.map(() => null);
    }
  }

  /**
   * Get Redis client for direct access
   */
  getClient(): Redis {
    return this.redis;
  }

  /**
   * Check if hash field exists
   * @param key Redis key
   * @param field Hash field
   * @returns boolean
   */
  async hexists(key: string, field: string): Promise<boolean> {
    try {
      return (await this.redis.hexists(key, field)) === 1;
    } catch (error) {
      this.logger.error(`Failed to check hash field existence: ${key}:${field}`, error);
      return false;
    }
  }

  /**
   * Set hash field
   * @param key Redis key
   * @param field Hash field
   * @param value Value to store
   */
  async hset(key: string, field: string, value: string): Promise<void> {
    try {
      await this.redis.hset(key, field, value);
      this.logger.debug(`Successfully set hash field: ${key}:${field}`);
    } catch (error) {
      this.logger.error(`Failed to set hash field: ${key}:${field}`, error);
      throw error;
    }
  }

  /**
   * Push to list (left push)
   * @param key Redis key
   * @param value Value to push
   */
  async lpush(key: string, value: string): Promise<void> {
    try {
      await this.redis.lpush(key, value);
      this.logger.debug(`Successfully pushed to list: ${key}`);
    } catch (error) {
      this.logger.error(`Failed to push to list: ${key}`, error);
      throw error;
    }
  }

  /**
   * Trim list to specified range
   * @param key Redis key
   * @param start Start index (0-based)
   * @param stop Stop index (inclusive)
   */
  async ltrim(key: string, start: number, stop: number): Promise<void> {
    try {
      await this.redis.ltrim(key, start, stop);
      this.logger.debug(`Successfully trimmed list: ${key} (${start}:${stop})`);
    } catch (error) {
      this.logger.error(`Failed to trim list: ${key}`, error);
      throw error;
    }
  }

  /**
   * Get range of elements from list
   * @param key Redis key
   * @param start Start index (0-based)
   * @param stop Stop index (inclusive)
   * @returns Array of elements
   */
  async lrange(key: string, start: number, stop: number): Promise<string[]> {
    try {
      const result = await this.redis.lrange(key, start, stop);
      this.logger.debug(`Successfully retrieved range from list: ${key} (${start}:${stop})`);
      return result as string[];
    } catch (error) {
      this.logger.error(`Failed to get range from list: ${key}`, error);
      return [];
    }
  }

  /**
   * Get length of list
   * @param key Redis key
   * @returns Length of list
   */
  async llen(key: string): Promise<number> {
    try {
      const result = await this.redis.llen(key);
      this.logger.debug(`Successfully got length of list: ${key}`);
      return result;
    } catch (error) {
      this.logger.error(`Failed to get length of list: ${key}`, error);
      return 0;
    }
  }

  /**
   * Set expiration for a key
   * @param key Redis key
   * @param ttl Time to live in seconds
   */
  async expire(key: string, ttl: number): Promise<void> {
    try {
      await this.redis.expire(key, ttl);
      this.logger.debug(`Successfully set expiration for key: ${key} (${ttl}s)`);
    } catch (error) {
      this.logger.error(`Failed to set expiration for key: ${key}`, error);
      throw error;
    }
  }

  /**
   * Publish message to channel
   * @param channel Channel name
   * @param message Message to publish
   */
  async publish(channel: string, message: string): Promise<void> {
    try {
      await this.redis.publish(channel, message);
      this.logger.debug(`Successfully published message to channel: ${channel}`);
    } catch (error) {
      this.logger.error(`Failed to publish message to channel: ${channel}`, error);
      throw error;
    }
  }

  /**
   * Subscribe to a Redis channel
   * @param channel Channel name
   * @param callback Callback function to handle messages
   */
  subscribe(channel: string, callback: (message: string) => void): void {
    try {
      this.redis.subscribe(channel, (err) => {
        if (err) {
          this.logger.error(`Failed to subscribe to channel: ${channel}`, err);
        } else {
          this.logger.debug(`Successfully subscribed to channel: ${channel}`);
        }
      });

      this.redis.on('message', (receivedChannel, message) => {
        if (receivedChannel === channel) {
          callback(message);
        }
      });
    } catch (error) {
      this.logger.error(`Failed to subscribe to channel: ${channel}`, error);
    }
  }

  /**
   * Unsubscribe from a Redis channel
   * @param channel Channel name
   */
  unsubscribe(channel: string): void {
    try {
      this.redis.unsubscribe(channel);
      this.logger.debug(`Successfully unsubscribed from channel: ${channel}`);
    } catch (error) {
      this.logger.error(`Failed to unsubscribe from channel: ${channel}`, error);
    }
  }
}
