
import { SchedulerModule } from './scheduler';
import { RedisModule } from './redis';

import { EventBusModule } from './events';
import { AppHealthModule } from './app-health';
import { LoggingModule } from './logging';

// Export all infrastructure modules
export * from './app-health';
export * from './events';
export * from './logging';

export * from './redis';
export * from './scheduler';


// Export modules array for easy importing
export { AppHealthModule } from './app-health';
export { EventBusModule } from './events';
export { LoggingModule } from './logging';

export { RedisModule } from './redis';
export { SchedulerModule } from './scheduler';


// Array of all infrastructure modules for convenience
export const INFRASTRUCTURE_MODULES = [
  LoggingModule, // Must be first for proper initialization
  AppHealthModule,
  EventBusModule,

  RedisModule,
  SchedulerModule,

];
