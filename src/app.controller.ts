import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { AppService } from './app.service';
import { ApiMessage, ApiStandardResponses } from './common/decorators';
// Response format handled by global interceptor

@ApiTags('app')
@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  @ApiOperation({
    summary: 'Get application information',
    description:
      'Returns basic information about the application including name, version, and environment',
  })
  @ApiMessage('Application information retrieved successfully')
  @ApiStandardResponses()
  getAppInfo() {
    return this.appService.getAppInfo();
  }
}
