import { Event } from '../interfaces';

export class CommentCreatedEvent implements Event {
  readonly eventName = 'comment.created';
  readonly aggregateId: string;
  readonly tokenAddress: string;
  readonly walletAddress: string;
  readonly content: string;
  readonly userId: string;
  readonly timestamp?: string;

  constructor(
    aggregateId: string,
    tokenAddress: string,
    walletAddress: string,
    content: string,
    userId: string,
  ) {
    this.aggregateId = aggregateId;
    this.tokenAddress = tokenAddress;
    this.walletAddress = walletAddress;
    this.content = content;
    this.userId = userId;
    this.timestamp = new Date().toISOString();
  }
}
