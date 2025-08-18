import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { HealthService } from './health.service';
import { ApiMessage, ApiStandardResponses } from '../../../common/decorators';

@ApiTags('health')
@Controller('health')
export class HealthController {
  constructor(private readonly healthService: HealthService) {}

  @Get()
  @ApiOperation({
    summary: 'Basic health check endpoint',
    description: 'Returns basic health status of the application',
  })
  @ApiMessage('Service is healthy')
  @ApiStandardResponses()
  getHealth() {
    return this.healthService.getHealth();
  }

  @Get('detailed')
  @ApiOperation({
    summary: 'Detailed health check with dependencies',
    description:
      'Returns comprehensive health information including dependency status and system metrics',
  })
  @ApiMessage('Detailed health information retrieved successfully')
  @ApiStandardResponses()
  async getDetailedHealth() {
    return this.healthService.getDetailedHealth();
  }
}
