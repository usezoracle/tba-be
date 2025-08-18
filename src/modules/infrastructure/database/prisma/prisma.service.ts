import { prismaConfig } from './prisma.config';
import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { PinoLogger } from 'nestjs-pino';

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  private connectionCheckInterval: NodeJS.Timeout | null = null;

  constructor(private readonly logger: PinoLogger) {
    super({
      ...prismaConfig,
      // Enhanced connection handling for Neon
      datasources: {
        db: {
          url: process.env.DATABASE_URL, // Use pooled connection
        },
      },
      // Connection management
      log: prismaConfig.log,
      errorFormat: prismaConfig.errorFormat,
    });
    this.logger.setContext(PrismaService.name);

    // Set up connection event handlers
    this.setupConnectionHandlers();
  }

  private setupConnectionHandlers() {
    // Handle connection events
    this.$on('query', (e) => {
      this.logger.debug('Database query executed', {
        query: e.query,
        params: e.params,
        duration: e.duration,
      });
    });

    // Handle connection errors
    this.$on('error', (e) => {
      this.logger.error('Database error occurred', {
        target: e.target,
        timestamp: e.timestamp,
      });
    });

    // Handle connection info
    this.$on('info', (e) => {
      this.logger.info('Database info', {
        message: e.message,
        target: e.target,
      });
    });

    // Handle warnings
    this.$on('warn', (e) => {
      this.logger.warn('Database warning', {
        message: e.message,
        target: e.target,
      });
    });
  }

  async onModuleInit() {
    try {
      await this.$connect();
      this.logger.info('🔗🗄️ Successfully connected to the database...');

      // Test connection health
      await this.$queryRaw`SELECT 1`;
      this.logger.info('✅ Database connection health check passed');

      // Start periodic connection health checks
      this.startConnectionMonitoring();
    } catch (error) {
      this.logger.error('❌🗄️ Failed to connect to the database...', error);
      throw error;
    }
  }

  async onModuleDestroy() {
    try {
      // Stop connection monitoring
      this.stopConnectionMonitoring();

      await this.$disconnect();
      this.logger.info('Successfully disconnected from the database');
    } catch (error) {
      this.logger.error('Error disconnecting from the database', error);
      throw error;
    }
  }

  private startConnectionMonitoring() {
    // Check connection health every 30 seconds
    this.connectionCheckInterval = setInterval(async () => {
      try {
        await this.$queryRaw`SELECT 1`;
        this.logger.debug('Database connection health check passed');
      } catch (error) {
        this.logger.warn('Database connection health check failed, attempting to reconnect...', error);
        try {
          await this.$connect();
          this.logger.info('Successfully reconnected to database');
        } catch (reconnectError) {
          this.logger.error('Failed to reconnect to database', reconnectError);
        }
      }
    }, 30000); // 30 seconds
  }

  private stopConnectionMonitoring() {
    if (this.connectionCheckInterval) {
      clearInterval(this.connectionCheckInterval);
      this.connectionCheckInterval = null;
    }
  }

  // Health check method for connection status
  async healthCheck(): Promise<boolean> {
    try {
      await this.$queryRaw`SELECT 1`;
      return true;
    } catch (error) {
      this.logger.error('Database health check failed', error);
      return false;
    }
  }
}
