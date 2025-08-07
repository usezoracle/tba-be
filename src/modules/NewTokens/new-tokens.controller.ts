import { Controller, Get, Post, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { CodexProvider } from './providers/codex.provider';

@ApiTags('new-tokens')
@Controller('new-tokens')
export class NewTokensController {
  constructor(private readonly codexProvider: CodexProvider) {}

  @Get()
  @ApiOperation({ summary: 'Get new tokens information' })
  @ApiResponse({ 
    status: 200, 
    description: 'Returns information about new tokens subscription' 
  })
  getNewTokensInfo() {
    return {
      message: 'New tokens subscription service',
      status: 'active',
      description: 'Service for monitoring new TBA and Zora tokens',
      networks: {
        tba: {
          name: 'Base',
          networkId: 8453,
          protocol: 'Baseapp'
        },
        zora: {
          name: 'Zora V4',
          networkId: 324,
          protocols: ['ZoraV4', 'ZoraCreatorV4']
        }
      }
    };
  }

  @Post('subscribe')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Start new tokens subscription' })
  @ApiResponse({ 
    status: 200, 
    description: 'Subscription started successfully' 
  })
  startSubscription() {
    try {
      const subscription = this.codexProvider.subscribeToNewTokens();
      return {
        message: 'New tokens subscription started successfully',
        status: 'active',
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      return {
        message: 'Failed to start subscription',
        error: error.message,
        status: 'error',
        timestamp: new Date().toISOString()
      };
    }
  }

  @Get('status')
  @ApiOperation({ summary: 'Get subscription status' })
  @ApiResponse({ 
    status: 200, 
    description: 'Returns current subscription status' 
  })
  getSubscriptionStatus() {
    return {
      service: 'New Tokens Subscription',
      status: 'running',
      networks: ['Base (TBA)', 'Zora V4'],
      timestamp: new Date().toISOString()
    };
  }
}
