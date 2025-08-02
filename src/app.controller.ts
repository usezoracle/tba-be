import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { AppService } from './app.service';
// Response format handled by global interceptor

@ApiTags('app')
@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  @ApiOperation({ 
    summary: 'Get application information',
    description: 'Returns basic information about the application including name, version, and environment'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Application information retrieved successfully',
    schema: {
      example: {
        status: 'success',
        data: {
          name: 'Zora TBA Coins API',
          version: '1.0.0',
          description: 'Production-grade API for Zora and TBA token data',
          environment: 'development',
          timestamp: '2025-07-30T01:23:45.678Z'
        },
        timestamp: '2025-07-30T01:23:45.678Z'
      }
    }
  })
  getAppInfo() {
    return this.appService.getAppInfo();
  }
}