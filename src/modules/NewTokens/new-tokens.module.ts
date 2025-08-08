import { Module } from '@nestjs/common';
import { NewTokensController } from './new-tokens.controller';
import { NewTokensService } from './services/new-tokens.service';
import { CodexProvider } from './providers/codex.provider';
import { EventBusModule } from '../infrastructure/events';

@Module({
  imports: [EventBusModule],
  controllers: [NewTokensController],
  providers: [CodexProvider, NewTokensService],
  exports: [CodexProvider, NewTokensService],
})
export class NewTokensModule {}
