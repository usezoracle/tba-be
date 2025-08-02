import { Injectable } from '@nestjs/common';
import { EventsHandler, IEventHandler } from '@nestjs/cqrs';
import { PinoLogger } from 'nestjs-pino';
import { TokensUpdatedEvent } from '../definitions/tokens.events';
import { TOKENS_UPDATED } from '@/shared/constants';

@Injectable()
@EventsHandler(TokensUpdatedEvent)
export class TokenEventsHandler implements IEventHandler<TokensUpdatedEvent> {
  constructor(
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(TokenEventsHandler.name);
  }

  async handle(event: TokensUpdatedEvent) {
    this.logger.debug(`Handling ${TOKENS_UPDATED} event`);
    
    try {
      // Extract information from the event
      const { tokens, scanResult } = event;
      
      this.logger.info(
        `Token update processed: ${tokens.length} tokens found in scan from block ${scanResult.startBlock} to ${scanResult.endBlock}`
      );
      
      // Additional processing can be done here:
      // - Notify other services about token updates
      // - Update analytics or monitoring
      // - Trigger additional workflows

    } catch (error) {
      this.logger.error(`Failed to handle ${TOKENS_UPDATED} event`, error);
    }
  }
}