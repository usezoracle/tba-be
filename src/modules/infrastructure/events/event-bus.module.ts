import { EventEmitterModule } from '@nestjs/event-emitter';

import { EventDefinitions } from './definitions';
import { Module, Global } from '@nestjs/common';
import { DefinitionHandlers } from './handlers';
import { EventBusService } from './bus';
import { RedisModule } from '../redis';
// import { TokensModule } from '../../Tokens/tokens.module';

@Global()
@Module({
  imports: [
    EventEmitterModule.forRoot({
      wildcard: true,
      delimiter: '.',
      maxListeners: 20,
    }),
    RedisModule,
    // TokensModule,
  ],
  providers: [EventBusService, ...EventDefinitions, ...DefinitionHandlers],
  exports: [EventBusService],
})
export class EventBusModule {}
