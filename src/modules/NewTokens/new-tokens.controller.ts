import {
  Controller,
  Get,
  Post,
  HttpCode,
  HttpStatus,
  Query,
  Res,
  Logger,
  ParseIntPipe,
  DefaultValuePipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery } from '@nestjs/swagger';
import { Response } from 'express';
import { CodexProvider } from './providers/codex.provider';
import { NewTokensService, PaginatedTokensResponse } from './services/new-tokens.service';
import { ApiMessage, ApiStandardResponses } from '../../common/decorators';
import { ApiPagination } from '../../common/decorators/api-pagination.decorator';

@ApiTags('new-tokens')
@Controller('new-tokens')
export class NewTokensController {
  private readonly logger = new Logger(NewTokensController.name);

  constructor(
    private readonly codexProvider: CodexProvider,
    private readonly newTokensService: NewTokensService,
  ) {}

  // Removed the informational endpoint

  @Get('tokens')
  @ApiOperation({ summary: 'Get paginated tokens' })
  @ApiMessage('Tokens retrieved successfully')
  @ApiPagination()
  @ApiStandardResponses()
  @ApiQuery({ name: 'page', required: false, description: 'Page number (default: 1). Ignored if offset is provided.' })
  @ApiQuery({ name: 'limit', required: false, description: 'Tokens per page (default: 30, max: 100)' })
  @ApiQuery({ name: 'offset', required: false, description: 'Absolute offset into newest-first list. Use this with SSE snapshot length for seamless paging.' })
  async getTokens(
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(50), ParseIntPipe) limit: number,
    @Query('offset') offset?: string,
  ): Promise<PaginatedTokensResponse> {
    const numericOffset = offset !== undefined ? Math.max(0, parseInt(offset, 10) || 0) : undefined;
    this.logger.log(`Getting tokens - page: ${page}, limit: ${limit}${numericOffset !== undefined ? `, offset: ${numericOffset}` : ''}`);
    return this.newTokensService.getLatestTokens(page, limit, numericOffset);
  }

  @Get('tokens/stream')
  @ApiOperation({ summary: 'Stream new tokens via Server-Sent Events' })
  @ApiResponse({
    status: 200,
    description: 'SSE stream of new tokens',
  })
  async streamTokens(@Res() res: Response, @Query('initial', new DefaultValuePipe(100), ParseIntPipe) initial: number) {
    this.logger.log('Starting SSE stream for new tokens');

    // Set SSE headers
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Cache-Control',
    });

    // Send initial connection message
    res.write(`data: ${JSON.stringify({ type: 'connection', message: 'Connected to new tokens stream' })}\n\n`);

    // Send initial snapshot (newest first) to avoid extra HTTP fetch
    try {
      const snapshot = await this.newTokensService.getInitialSnapshot(Math.min(Math.max(initial, 1), 100));
      res.write(`data: ${JSON.stringify({ type: 'snapshot', items: snapshot })}\n\n`);
    } catch (error) {
      this.logger.error('Failed to send initial snapshot', error);
    }

    // Subscribe to Redis channel for real-time updates
    const subscriber = (tokenData) => {
      try {
        res.write(`data: ${JSON.stringify(tokenData)}\n\n`);
        this.logger.debug(`Sent token update via SSE: ${tokenData.address}`);
      } catch (error) {
        this.logger.error('Failed to send token update via SSE', error);
      }
    };
    this.newTokensService.subscribeToTokenUpdates(subscriber);

    // Handle client disconnect
    res.on('close', () => {
      this.logger.log('Client disconnected from SSE stream');
      this.newTokensService.unsubscribeFromTokenUpdates(subscriber);
    });

    // Handle errors
    res.on('error', (error) => {
      this.logger.error('SSE stream error', error);
      this.newTokensService.unsubscribeFromTokenUpdates(subscriber);
    });
  }

  // Removed the status endpoint as requested
}
