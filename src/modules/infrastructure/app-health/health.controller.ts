import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { HealthService } from './health.service';

@ApiTags('health')
@Controller('health')
export class HealthController {
  constructor(private readonly healthService: HealthService) { }

  @Get()
  @ApiOperation({
    summary: 'Basic health check endpoint',
    description: 'Returns basic health status of the application'
  })
  @ApiResponse({
    status: 200,
    description: 'Service is healthy',
    schema: {
      example: {
        status: 'success',
        data: {
          status: 'ok',
          timestamp: '2025-07-30T01:23:45.678Z',
          uptime: 12345,
          version: '1.0.0',
          environment: 'development'
        },
        timestamp: '2025-07-30T01:23:45.678Z'
      }
    },
  })
  getHealth() {
    return this.healthService.getHealth();
  }

  @Get('detailed')
  @ApiOperation({
    summary: 'Detailed health check with dependencies',
    description: 'Returns comprehensive health information including dependency status and system metrics'
  })
  @ApiResponse({
    status: 200,
    description: 'Detailed health information retrieved successfully',
    schema: {
      example: {
        status: 'success',
        data: {
          status: 'ok',
          timestamp: '2025-07-30T01:23:45.678Z',
          uptime: 12345,
          version: '1.0.0',
          environment: 'development',
          dependencies: {
            redis: { status: 'healthy', latency: 15 },
            blockchain: { status: 'healthy', latency: 250 }
          },
          system: {
            memory: { rss: 123456, heapTotal: 67890, heapUsed: 45678 },
            cpu: { user: 1000, system: 500 },
            platform: 'darwin',
            nodeVersion: 'v18.17.0'
          }
        },
        timestamp: '2025-07-30T01:23:45.678Z'
      }
    }
  })
  async getDetailedHealth() {
    return this.healthService.getDetailedHealth();
  }
}