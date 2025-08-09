import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { WatchlistService } from './services/watchlist.service';
import { WatchlistController } from './watchlist.controller';
import { PrismaModule } from '../infrastructure/database';
import { RedisModule } from '../infrastructure/redis';
import { LoggingModule } from '../infrastructure/logging';
import { EventBusModule } from '../infrastructure/events';

@Module({
  imports: [
    ConfigModule,
    PrismaModule,
    RedisModule,
    LoggingModule,
    EventBusModule,
  ],
  controllers: [WatchlistController],
  providers: [WatchlistService],
  exports: [WatchlistService],
})
export class WatchlistModule {}

