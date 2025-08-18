import { ApiProperty } from '@nestjs/swagger';

// ============================================================================
// BASIC HEALTH RESPONSE SCHEMA
// ============================================================================

export class BasicHealthResponse {
  @ApiProperty({
    description: 'Health status',
    example: 'ok',
    enum: ['ok', 'degraded', 'down']
  })
  status: 'ok' | 'degraded' | 'down';

  @ApiProperty({
    description: 'Current timestamp',
    example: '2025-08-15T18:00:00.000Z'
  })
  timestamp: string;

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
}

// ============================================================================
// DEPENDENCY HEALTH SCHEMA
// ============================================================================

export class DependencyHealthResponse {
  @ApiProperty({
    description: 'Dependency health status',
    example: 'healthy',
    enum: ['healthy', 'degraded', 'down']
  })
  status: 'healthy' | 'degraded' | 'down';

  @ApiProperty({
    description: 'Response latency in milliseconds',
    example: 15
  })
  latency: number;

  @ApiProperty({
    description: 'Last check timestamp',
    example: '2025-08-15T18:00:00.000Z'
  })
  lastCheck: string;

  @ApiProperty({
    description: 'Error message if unhealthy',
    example: 'Connection timeout',
    required: false
  })
  error?: string;

  @ApiProperty({
    description: 'Additional health details',
    type: 'object',
    properties: {
      version: { type: 'string', example: '6.2.0' },
      connections: { type: 'number', example: 5 },
      memoryUsage: { type: 'string', example: '45.2 MB' }
    },
    required: false
  })
  details?: Record<string, any>;
}

// ============================================================================
// SYSTEM METRICS SCHEMA
// ============================================================================

export class SystemMetricsResponse {
  @ApiProperty({
    description: 'Memory usage information',
    type: 'object',
    properties: {
      rss: { type: 'number', example: 123456, description: 'Resident Set Size in bytes' },
      heapTotal: { type: 'number', example: 67890, description: 'Total heap size in bytes' },
      heapUsed: { type: 'number', example: 45678, description: 'Used heap size in bytes' },
      external: { type: 'number', example: 1234, description: 'External memory in bytes' }
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
      user: { type: 'number', example: 1000, description: 'User CPU time in milliseconds' },
      system: { type: 'number', example: 500, description: 'System CPU time in milliseconds' }
    }
  })
  cpu: {
    user: number;
    system: number;
  };

  @ApiProperty({
    description: 'Platform information',
    example: 'darwin'
  })
  platform: string;

  @ApiProperty({
    description: 'Node.js version',
    example: 'v18.17.0'
  })
  nodeVersion: string;

  @ApiProperty({
    description: 'Operating system information',
    type: 'object',
    properties: {
      type: { type: 'string', example: 'Darwin' },
      release: { type: 'string', example: '24.1.0' },
      arch: { type: 'string', example: 'x64' }
    }
  })
  os: {
    type: string;
    release: string;
    arch: string;
  };

  @ApiProperty({
    description: 'Process information',
    type: 'object',
    properties: {
      pid: { type: 'number', example: 12345 },
      title: { type: 'string', example: 'node' },
      argv: { type: 'array', items: { type: 'string' }, example: ['node', 'dist/main.js'] }
    }
  })
  process: {
    pid: number;
    title: string;
    argv: string[];
  };
}

// ============================================================================
// DETAILED HEALTH RESPONSE SCHEMA
// ============================================================================

export class DetailedHealthResponse {
  @ApiProperty({
    description: 'Overall health status',
    example: 'ok',
    enum: ['ok', 'degraded', 'down']
  })
  status: 'ok' | 'degraded' | 'down';

  @ApiProperty({
    description: 'Current timestamp',
    example: '2025-08-15T18:00:00.000Z'
  })
  timestamp: string;

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
    description: 'Dependencies health status',
    type: 'object',
    properties: {
      redis: { type: 'object', description: 'Redis health status' },
      database: { type: 'object', description: 'Database health status' },
      external: { type: 'object', description: 'External services health status' }
    }
  })
  dependencies: {
    redis: DependencyHealthResponse;
    database: DependencyHealthResponse;
    external?: DependencyHealthResponse;
  };

  @ApiProperty({
    description: 'System metrics and information',
    type: SystemMetricsResponse
  })
  system: SystemMetricsResponse;

  @ApiProperty({
    description: 'Health check duration in milliseconds',
    example: 125
  })
  checkDuration: number;

  @ApiProperty({
    description: 'Additional health information',
    type: 'object',
    properties: {
      lastBackup: { type: 'string', example: '2025-08-15T12:00:00.000Z' },
      sslExpiry: { type: 'string', example: '2026-01-15T00:00:00.000Z' },
      maintenanceMode: { type: 'boolean', example: false }
    },
    required: false
  })
  additional?: Record<string, any>;
}

// ============================================================================
// HEALTH CHECK REQUEST SCHEMA
// ============================================================================

export class HealthCheckRequest {
  @ApiProperty({
    description: 'Include detailed system metrics',
    example: false,
    default: false,
    required: false
  })
  detailed?: boolean = false;

  @ApiProperty({
    description: 'Include dependency health checks',
    example: true,
    default: true,
    required: false
  })
  dependencies?: boolean = true;

  @ApiProperty({
    description: 'Timeout for health checks in milliseconds',
    example: 5000,
    default: 5000,
    required: false
  })
  timeout?: number = 5000;
}

// ============================================================================
// HEALTH STATUS ENUMERATIONS
// ============================================================================

export type HealthStatus = 'ok' | 'degraded' | 'down';
export type DependencyStatus = 'healthy' | 'degraded' | 'down';

export const HEALTH_STATUSES: HealthStatus[] = ['ok', 'degraded', 'down'];
export const DEPENDENCY_STATUSES: DependencyStatus[] = ['healthy', 'degraded', 'down'];

export const HEALTH_STATUS_DESCRIPTIONS: Record<HealthStatus, string> = {
  ok: 'All systems operational',
  degraded: 'Some systems experiencing issues',
  down: 'Critical systems unavailable'
};

export const DEPENDENCY_STATUS_DESCRIPTIONS: Record<DependencyStatus, string> = {
  healthy: 'Dependency is functioning normally',
  degraded: 'Dependency is experiencing performance issues',
  down: 'Dependency is unavailable'
};

// ============================================================================
// HEALTH METRICS SCHEMA
// ============================================================================

export class HealthMetricsResponse {
  @ApiProperty({
    description: 'Health check success rate',
    example: 0.998,
    minimum: 0,
    maximum: 1
  })
  successRate: number;

  @ApiProperty({
    description: 'Average response time in milliseconds',
    example: 125
  })
  averageResponseTime: number;

  @ApiProperty({
    description: 'Total health checks performed',
    example: 15000
  })
  totalChecks: number;

  @ApiProperty({
    description: 'Successful health checks',
    example: 14970
  })
  successfulChecks: number;

  @ApiProperty({
    description: 'Failed health checks',
    example: 30
  })
  failedChecks: number;

  @ApiProperty({
    description: 'Last failure timestamp',
    example: '2025-08-15T17:30:00.000Z',
    required: false
  })
  lastFailure?: string;

  @ApiProperty({
    description: 'Health check history',
    type: 'array',
    items: {
      type: 'object',
      properties: {
        timestamp: { type: 'string', example: '2025-08-15T18:00:00.000Z' },
        status: { type: 'string', example: 'ok' },
        responseTime: { type: 'number', example: 125 },
        dependencies: { type: 'object' }
      }
    },
    maxItems: 100
  })
  history: Array<{
    timestamp: string;
    status: HealthStatus;
    responseTime: number;
    dependencies: Record<string, DependencyStatus>;
  }>;

  @ApiProperty({
    description: 'When the metrics were collected',
    example: '2025-08-15T18:00:00.000Z'
  })
  collectedAt: string;
}
