import { ApiProperty } from '@nestjs/swagger';

// ============================================================================
// APP INFO RESPONSE SCHEMA
// ============================================================================

export class AppInfoResponse {
  @ApiProperty({
    description: 'Application name',
    example: 'Zora TBA Coins API'
  })
  name: string;

  @ApiProperty({
    description: 'Application version',
    example: '1.0.0'
  })
  version: string;

  @ApiProperty({
    description: 'Application description',
    example: 'Production-grade API for Zora and TBA token data'
  })
  description: string;

  @ApiProperty({
    description: 'Current environment',
    example: 'development',
    enum: ['development', 'staging', 'production']
  })
  environment: 'development' | 'staging' | 'production';

  @ApiProperty({
    description: 'Current timestamp',
    example: '2025-08-15T18:00:00.000Z'
  })
  timestamp: string;
}

// ============================================================================
// APP STATUS RESPONSE SCHEMA
// ============================================================================

export class AppStatusResponse {
  @ApiProperty({
    description: 'Application status',
    example: 'running',
    enum: ['starting', 'running', 'stopping', 'stopped', 'error']
  })
  status: 'starting' | 'running' | 'stopping' | 'stopped' | 'error';

  @ApiProperty({
    description: 'Application uptime in seconds',
    example: 3600
  })
  uptime: number;

  @ApiProperty({
    description: 'Application version',
    example: '1.0.0'
  })
  version: string;

  @ApiProperty({
    description: 'Current environment',
    example: 'development'
  })
  environment: string;

  @ApiProperty({
    description: 'Node.js version',
    example: 'v18.17.0'
  })
  nodeVersion: string;

  @ApiProperty({
    description: 'Platform information',
    example: 'darwin'
  })
  platform: string;

  @ApiProperty({
    description: 'Memory usage information',
    type: 'object',
    properties: {
      rss: { type: 'number', example: 123456 },
      heapTotal: { type: 'number', example: 67890 },
      heapUsed: { type: 'number', example: 45678 },
      external: { type: 'number', example: 1234 }
    }
  })
  memory: {
    rss: number;
    heapTotal: number;
    heapUsed: number;
    external: number;
  };

  @ApiProperty({
    description: 'CPU usage information',
    type: 'object',
    properties: {
      user: { type: 'number', example: 1000 },
      system: { type: 'number', example: 500 }
    }
  })
  cpu: {
    user: number;
    system: number;
  };

  @ApiProperty({
    description: 'When the status was checked',
    example: '2025-08-15T18:00:00.000Z'
  })
  timestamp: string;
}

// ============================================================================
// APP CONFIG RESPONSE SCHEMA
// ============================================================================

export class AppConfigResponse {
  @ApiProperty({
    description: 'API configuration',
    type: 'object',
    properties: {
      prefix: { type: 'string', example: 'api/v1' },
      cors: { type: 'object', example: { origin: ['http://localhost:3000'] } },
      rateLimit: { type: 'object', example: { ttl: 60000, limit: 100 } }
    }
  })
  api: {
    prefix: string;
    cors: Record<string, any>;
    rateLimit: Record<string, any>;
  };

  @ApiProperty({
    description: 'Database configuration',
    type: 'object',
    properties: {
      provider: { type: 'string', example: 'postgresql' },
      url: { type: 'string', example: 'postgresql://...' },
      poolSize: { type: 'number', example: 10 }
    }
  })
  database: {
    provider: string;
    url: string;
    poolSize: number;
  };

  @ApiProperty({
    description: 'Redis configuration',
    type: 'object',
    properties: {
      host: { type: 'string', example: 'localhost' },
      port: { type: 'number', example: 6379 },
      db: { type: 'number', example: 0 }
    }
  })
  redis: {
    host: string;
    port: number;
    db: number;
  };

  @ApiProperty({
    description: 'Logging configuration',
    type: 'object',
    properties: {
      level: { type: 'string', example: 'info' },
      format: { type: 'string', example: 'json' },
      destination: { type: 'string', example: 'console' }
    }
  })
  logging: {
    level: string;
    format: string;
    destination: string;
  };

  @ApiProperty({
    description: 'When the configuration was loaded',
    example: '2025-08-15T18:00:00.000Z'
  })
  loadedAt: string;
}

// ============================================================================
// APP METRICS RESPONSE SCHEMA
// ============================================================================

export class AppMetricsResponse {
  @ApiProperty({
    description: 'Request metrics',
    type: 'object',
    properties: {
      total: { type: 'number', example: 15000 },
      successful: { type: 'number', example: 14800 },
      failed: { type: 'number', example: 200 },
      averageResponseTime: { type: 'number', example: 125 }
    }
  })
  requests: {
    total: number;
    successful: number;
    failed: number;
    averageResponseTime: number;
  };

  @ApiProperty({
    description: 'Database metrics',
    type: 'object',
    properties: {
      connections: { type: 'number', example: 5 },
      queries: { type: 'number', example: 25000 },
      slowQueries: { type: 'number', example: 15 },
      averageQueryTime: { type: 'number', example: 45 }
    }
  })
  database: {
    connections: number;
    queries: number;
    slowQueries: number;
    averageQueryTime: number;
  };

  @ApiProperty({
    description: 'Redis metrics',
    type: 'object',
    properties: {
      connections: { type: 'number', example: 3 },
      operations: { type: 'number', example: 50000 },
      hitRate: { type: 'number', example: 0.95 },
      averageOperationTime: { type: 'number', example: 2 }
    }
  })
  redis: {
    connections: number;
    operations: number;
    hitRate: number;
    averageOperationTime: number;
  };

  @ApiProperty({
    description: 'System metrics',
    type: 'object',
    properties: {
      memoryUsage: { type: 'number', example: 0.65 },
      cpuUsage: { type: 'number', example: 0.25 },
      diskUsage: { type: 'number', example: 0.45 }
    }
  })
  system: {
    memoryUsage: number;
    cpuUsage: number;
    diskUsage: number;
  };

  @ApiProperty({
    description: 'When the metrics were collected',
    example: '2025-08-15T18:00:00.000Z'
  })
  collectedAt: string;
}

// ============================================================================
// APP ERROR RESPONSE SCHEMA
// ============================================================================

export class AppErrorResponse {
  @ApiProperty({
    description: 'Error status',
    example: 'error'
  })
  status: string;

  @ApiProperty({
    description: 'Error message',
    example: 'An unexpected error occurred'
  })
  message: string;

  @ApiProperty({
    description: 'Error code',
    example: 'INTERNAL_SERVER_ERROR',
    required: false
  })
  code?: string;

  @ApiProperty({
    description: 'Error details',
    example: 'Database connection failed',
    required: false
  })
  details?: string;

  @ApiProperty({
    description: 'Error timestamp',
    example: '2025-08-15T18:00:00.000Z'
  })
  timestamp: string;

  @ApiProperty({
    description: 'Request ID for tracking',
    example: 'req_1234567890',
    required: false
  })
  requestId?: string;

  @ApiProperty({
    description: 'Error stack trace (only in development)',
    example: 'Error: Database connection failed\n    at...',
    required: false
  })
  stack?: string;
}
