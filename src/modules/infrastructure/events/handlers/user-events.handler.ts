import { Injectable, OnModuleInit } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { PinoLogger } from 'nestjs-pino';
import { UserCreatedEvent } from '../definitions/user-created.event';

interface WatchlistTokenAddedEvent {
  eventName: 'user.watchlist.token.added';
  aggregateId: string;
  userId: string;
  tokenAddresses: string[];
  timestamp: string;
}

interface WatchlistTokenRemovedEvent {
  eventName: 'user.watchlist.token.removed';
  aggregateId: string;
  userId: string;
  tokenAddresses: string[];
  timestamp: string;
}

@Injectable()
export class UserEventsHandler implements OnModuleInit {
  constructor(
    private readonly logger: PinoLogger,
    private readonly eventEmitter: EventEmitter2,
  ) {
    this.logger.setContext(UserEventsHandler.name);
  }

  onModuleInit() {
    // Register event handlers
    this.eventEmitter.on('user.created', this.handleUserCreated.bind(this));
    this.eventEmitter.on(
      'user.watchlist.token.added',
      this.handleTokenAddedToWatchlist.bind(this),
    );
    this.eventEmitter.on(
      'user.watchlist.token.removed',
      this.handleTokenRemovedFromWatchlist.bind(this),
    );
  }

  async handleUserCreated(event: UserCreatedEvent): Promise<void> {
    this.logger.info(
      `User created: ${event.aggregateId} with wallet address: ${event.walletAddress}`,
      {
        userId: event.aggregateId,
        walletAddress: event.walletAddress,
        timestamp: event.timestamp,
        eventType: 'user.created',
      },
    );

    // TODO: Add any additional user creation logic here
    // For example:
    // - Send welcome email
    // - Initialize user preferences
    // - Create default watchlist
    // - Send analytics event
    // - Trigger onboarding flow
    // - Initialize user settings
    // - Send welcome notification
  }

  async handleTokenAddedToWatchlist(event: WatchlistTokenAddedEvent): Promise<void> {
    this.logger.info(
      `Tokens added to watchlist: ${event.tokenAddresses.length} tokens for user: ${event.userId}`,
      {
        userId: event.userId,
        tokenAddresses: event.tokenAddresses,
        timestamp: event.timestamp,
        eventType: 'user.watchlist.token.added',
      },
    );

    // TODO: Add any additional token watchlist logic here
    // For example:
    // - Send notification about token price changes
    // - Initialize token tracking
    // - Send analytics event
    // - Update user preferences
    // - Trigger price alerts
    // - Update user dashboard
    // - Send email notification
  }

  async handleTokenRemovedFromWatchlist(event: WatchlistTokenRemovedEvent): Promise<void> {
    this.logger.info(
      `Tokens removed from watchlist: ${event.tokenAddresses.length} tokens for user: ${event.userId}`,
      {
        userId: event.userId,
        tokenAddresses: event.tokenAddresses,
        timestamp: event.timestamp,
        eventType: 'user.watchlist.token.removed',
      },
    );

    // TODO: Add any additional token removal logic here
    // For example:
    // - Stop token tracking
    // - Send analytics event
    // - Update user preferences
    // - Remove price alerts
    // - Update user dashboard
    // - Send confirmation email
  }
}
