import { Event } from '../interfaces';

export type EmojiType = 'like' | 'love' | 'laugh' | 'wow' | 'sad';

export class EmojiReactedEvent implements Event {
  readonly eventName = 'emoji.reacted';
  readonly aggregateId: string;
  readonly tokenAddress: string;
  readonly emoji: EmojiType;
  readonly increment: 1 | 2 | 3;
  readonly timestamp?: string;

  constructor(
    aggregateId: string,
    tokenAddress: string,
    emoji: EmojiType,
    increment: 1 | 2 | 3,
  ) {
    this.aggregateId = aggregateId;
    this.tokenAddress = tokenAddress;
    this.emoji = emoji;
    this.increment = increment;
    this.timestamp = new Date().toISOString();
  }
}
