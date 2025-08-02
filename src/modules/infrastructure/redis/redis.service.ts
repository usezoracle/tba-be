import { Injectable, Inject } from '@nestjs/common';
import { PinoLogger } from 'nestjs-pino';
import { ConfigType } from '@nestjs/config';
import { Redis } from '@upstash/redis';
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
    this.redis = new Redis({
      url: this.config.url,
      token: this.config.token,
    });
    this.logger.info('Redis client initialized');
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
        await this.redis.setex(key, ttl, JSON.stringify(data));
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
      return await this.redis.exists(key) === 1;
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
      const formatted = entries.reduce((acc, [key, value]) => {
        acc[key] = JSON.stringify(value);
        return acc;
      }, {});
      
      await this.redis.mset(formatted);
      this.logger.debug(`Successfully stored ${entries.length} key-value pairs`);
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
      return values.map(value => 
        value ? JSON.parse(value as string) as T : null
      );
    } catch (error) {
      this.logger.error('Failed to get multiple values', error);
      return keys.map(() => null);
    }
  }

  /**
   * Get the raw Redis client for advanced operations
   * @returns Redis client instance
   */
  getClient(): Redis {
    return this.redis;
  }
}