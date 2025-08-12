import { prismaConfig } from './prisma.config';
import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { PinoLogger } from 'nestjs-pino';

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  constructor(private readonly logger: PinoLogger) {
    super(prismaConfig);
    this.logger.setContext(PrismaService.name);
  }

  async onModuleInit() {
    try {
      await this.$connect();
      this.logger.info('🔗🗄️ Successfully connected to the database...');
    } catch (error) {
      this.logger.error('❌🗄️ Failed to connect to the database...', error);
      throw error;
    }
  }

  async onModuleDestroy() {
    try {
      await this.$disconnect();
      this.logger.info('Successfully disconnected from the database');
    } catch (error) {
      this.logger.error('Error disconnecting from the database', error);
      throw error;
    }
  }
}
