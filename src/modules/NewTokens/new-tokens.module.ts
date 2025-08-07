import { Module } from '@nestjs/common';
import { NewTokensController } from './new-tokens.controller';
import { CodexProvider } from './providers/codex.provider';
import { EventBusModule } from '../infrastructure/events';

@Module({
  imports: [EventBusModule],
  controllers: [NewTokensController],
  providers: [CodexProvider],
  exports: [CodexProvider],
})
export class NewTokensModule {}
