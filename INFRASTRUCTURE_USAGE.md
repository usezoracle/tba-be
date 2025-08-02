# Infrastructure Layer Usage Guide

## Overview

The infrastructure layer provides utilities for events, notifications, scheduling, workers, Redis, and health checks across your NestJS application. Each infrastructure component is a separate module that can be imported individually or as a group.

## Available Services

### 1. Event Bus Service

```typescript
import { EventBusService, Event } from '@/modules/infrastructure';

// In your service
constructor(private readonly eventBus: EventBusService) {}

// Publishing events
const event: Event = {
  eventName: 'user.created',
  aggregateId: userId,
  timestamp: Date.now(),
  payload: { userId, email }
};
this.eventBus.publish(event);

// Subscribing to events
this.eventBus.subscribe('user.created', (event) => {
  console.log('User created:', event.payload);
});
```

### 2. Redis Service

```typescript
import { RedisService } from '@/modules/infrastructure';

// Store and retrieve data
await this.redisService.storeTokens(tokens);
const tokens = await this.redisService.getAllTokens();
```

### 3. Health Service

```typescript
import { HealthService } from '@/modules/infrastructure';

// Get health status
const health = this.healthService.getHealth();
const detailedHealth = await this.healthService.getDetailedHealth();
```

### 4. Notification Service

```typescript
import { NotificationService } from '@/modules/infrastructure';

// Send notifications
await this.notificationService.send({
  type: 'email',
  recipient: 'user@example.com',
  subject: 'Welcome!',
  content: 'Welcome to our platform',
});
```

// Add job to queue
await this.queueService.add('email-queue', {
  to: 'user@example.com',
  template: 'welcome',
});
```

## Integration Examples

### In a Service

```typescript
import { Injectable } from '@nestjs/common';
import { EventBusService } from '@/modules/infrastructure';

@Injectable()
export class UserService {
  constructor(private readonly eventBus: EventBusService) {}

  async createUser(userData: any) {
    // Create user logic
    const user = await this.userRepository.save(userData);

    // Publish event
    this.eventBus.publish({
      eventName: 'user.created',
      aggregateId: user.id,
      timestamp: Date.now(),
      payload: user,
    });

    return user;
  }
}
```

### In a Module

```typescript
import { Module } from '@nestjs/common';
import { UserService } from './user.service';
// Infrastructure is globally available, no need to import

@Module({
  providers: [UserService],
  exports: [UserService],
})
export class UserModule {}
```

## Event Patterns

### Domain Events

```typescript
// Define your domain events
interface UserCreatedEvent extends Event {
  eventName: 'user.created';
  payload: {
    userId: string;
    email: string;
  };
}

// Publish domain events
this.eventBus.publish<UserCreatedEvent>({
  eventName: 'user.created',
  aggregateId: userId,
  timestamp: Date.now(),
  payload: { userId, email },
});
```

### Event Handlers

```typescript
@Injectable()
export class UserEventHandler {
  constructor(private readonly eventBus: EventBusService) {
    this.setupEventHandlers();
  }

  private setupEventHandlers() {
    this.eventBus.subscribe('user.created', this.handleUserCreated.bind(this));
    this.eventBus.subscribe('user.updated', this.handleUserUpdated.bind(this));
  }

  private async handleUserCreated(event: UserCreatedEvent) {
    // Send welcome email
    // Update analytics
    // Trigger other workflows
  }
}
```

## Best Practices

1. **Event Naming**: Use dot notation (e.g., `user.created`, `order.shipped`)
2. **Type Safety**: Define event interfaces extending the base `Event` type
3. **Error Handling**: Wrap event publishing in try-catch blocks
4. **Async Operations**: Use async handlers for database operations
5. **Testing**: Mock the infrastructure services in your tests

## Module Structure

```
src/modules/infrastructure/
├── infrastructure.module.ts    # Main module (globally registered)
├── index.ts                   # Exports all services and modules
├── services.ts               # Consolidated service exports
├── events/                   # Event bus implementation
├── notification/            # Notification services
├── scheduler/              # Cron job scheduling
├── workers/               # Queue processing
└── app-health/           # Health check utilities
```

## Configuration

The infrastructure modules are automatically configured and globally available. No additional setup required in your feature modules.
