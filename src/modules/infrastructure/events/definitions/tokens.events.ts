import { Event } from '../interfaces/event.interface';
import { TokenMetadata, ScanResult } from '@/shared';
import { TOKENS_UPDATED } from '@/shared';

export class TokensUpdatedEvent implements Event {
  readonly eventName = TOKENS_UPDATED;
  readonly aggregateId: string;
  readonly tokens: TokenMetadata[];
  readonly scanResult: ScanResult;
  readonly timestamp?: string = new Date().toISOString();

  constructor(aggregateId: string, tokens: TokenMetadata[], scanResult: ScanResult) {
    this.aggregateId = aggregateId;
    this.tokens = tokens;
    this.scanResult = scanResult;
  }
}

export const TokenEvents = [TokensUpdatedEvent]; 