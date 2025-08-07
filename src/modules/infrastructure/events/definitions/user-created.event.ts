import { Event } from '../interfaces';

export class UserCreatedEvent implements Event {
  readonly eventName = 'user.created';
  readonly aggregateId: string;
  readonly walletAddress: string;
  readonly timestamp?: string;

  constructor(aggregateId: string, walletAddress: string) {
    this.aggregateId = aggregateId;
    this.walletAddress = walletAddress;
    this.timestamp = new Date().toISOString();
  }
}
