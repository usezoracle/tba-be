import { Injectable, OnModuleInit } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { PinoLogger } from 'nestjs-pino';
import { UserCreatedEvent } from '../definitions/user-created.event';

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

  async handleTokenAddedToWatchlist(event: any): Promise<void> {
    this.logger.info(
      `Token added to watchlist: ${event.tokenAddress} for user: ${event.userId}`,
      {
        userId: event.userId,
        tokenAddress: event.tokenAddress,
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
  }

  async handleTokenRemovedFromWatchlist(event: any): Promise<void> {
    this.logger.info(
      `Token removed from watchlist: ${event.tokenAddress} for user: ${event.userId}`,
      {
        userId: event.userId,
        tokenAddress: event.tokenAddress,
        timestamp: event.timestamp,
        eventType: 'user.watchlist.token.removed',
      },
    );

    // TODO: Add any additional token removal logic here
    // For example:
    // - Stop token tracking
    // - Send analytics event
    // - Update user preferences
  }
}
