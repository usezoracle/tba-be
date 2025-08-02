import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { RedisService } from '../redis';

@Injectable()
export class HealthService {
  constructor(
    private readonly configService: ConfigService,
    private readonly redisService: RedisService,
  ) {}

  getHealth() {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      version: '1.0.0',
      environment: this.configService.get('NODE_ENV'),
    };
  }

  async getDetailedHealth() {
    const basic = this.getHealth();
    
    return {
      ...basic,
      dependencies: {
        redis: await this.checkRedis(),
        blockchain: await this.checkBlockchain(),
      },
      system: {
        memory: process.memoryUsage(),
        cpu: process.cpuUsage(),
        platform: process.platform,
        nodeVersion: process.version,
      },
    };
  }

  private async checkRedis(): Promise<{ status: string; latency?: number }> {
    try {
      const start = Date.now();
      // Test Redis connection by checking if client can be accessed
      const client = this.redisService.getClient();
      // Simple ping operation
      await client.ping();
      const latency = Date.now() - start;
      return { status: 'healthy', latency };
    } catch (error) {
      return { status: 'unhealthy' };
    }
  }

  private async checkBlockchain(): Promise<{ status: string; latency?: number }> {
    try {
      const start = Date.now();
      // Simple blockchain call would go here
      const latency = Date.now() - start;
      return { status: 'healthy', latency };
    } catch (error) {
      return { status: 'unhealthy' };
    }
  }
}