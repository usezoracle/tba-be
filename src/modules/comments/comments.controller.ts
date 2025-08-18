import { 
  Body, 
  Controller, 
  Get, 
  Param, 
  ParseIntPipe, 
  Post, 
  Query, 
  Res, 
  HttpCode,
  HttpStatus,
  BadRequestException,
  NotFoundException,
  DefaultValuePipe,
} from '@nestjs/common';
import { ApiOperation, ApiTags, ApiQuery, ApiParam, ApiBody } from '@nestjs/swagger';
import { COMMENTS_STREAM_DOC } from './docs/comments-stream.doc';
import { Response } from 'express';
import { CommentsService } from './services/comments.service';
import { CreateCommentDto } from './dto';
import { PinoLogger } from 'nestjs-pino';
import { RedisService } from '../infrastructure/redis/redis.service';
import { ApiMessage, ApiStandardResponses } from '../../common/decorators';

@ApiTags('comments')
@Controller('comments')
export class CommentsController {
  constructor(
    private readonly comments: CommentsService,
    private readonly redis: RedisService,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(CommentsController.name);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a new comment' })
  @ApiBody({ type: CreateCommentDto })
  @ApiMessage('Comment created successfully')
  @ApiStandardResponses(true)
  async create(@Body() dto: CreateCommentDto) {
    this.logger.info('Received comment creation request');
    return this.comments.create(dto);
  }

  @Get(':tokenAddress')
  @ApiOperation({ summary: 'Get latest comments for a token' })
  @ApiParam({ name: 'tokenAddress', description: 'Token address to get comments for' })
  @ApiQuery({ name: 'limit', required: false, description: 'Number of comments to return (default: 50, max: 100)' })
  @ApiMessage('Comments retrieved successfully')
  @ApiStandardResponses()
  async getComments(
    @Param('tokenAddress') tokenAddress: string,
    @Query('limit', new DefaultValuePipe(50), ParseIntPipe) limit: number,
  ) {
    const validatedLimit = Math.min(Math.max(limit, 1), 100);
    return this.comments.getLatest(tokenAddress, validatedLimit);
  }

  @Get('stream/:tokenAddress')
  @ApiOperation({
    summary: 'Stream comments for a token via Server-Sent Events',
    description: COMMENTS_STREAM_DOC,
  })
  @ApiParam({ name: 'tokenAddress', description: 'Token address to stream comments for' })
  @ApiQuery({ name: 'initial', required: false, description: 'Number of initial comments to send (default: 50, max: 100)' })
  async stream(
    @Param('tokenAddress') tokenAddress: string,
    @Res() res: Response,
    @Query('initial', new DefaultValuePipe(50), ParseIntPipe) initial: number,
  ) {
    const limit = Math.min(Math.max(initial, 1), 100);
    const channel = `comments:${tokenAddress.toLowerCase()}`;

    this.logger.info(`Starting SSE stream for comments on token: ${tokenAddress}`);

    // Set SSE headers
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Cache-Control',
    });

    // Send initial connection message
    res.write(`event: connection\n`);
    res.write(`data: ${JSON.stringify({ 
      type: 'connection', 
      message: 'Connected to comments stream',
      tokenAddress: tokenAddress.toLowerCase()
    })}\n\n`);

    // Send initial payload
    try {
      const latest = await this.comments.getLatest(tokenAddress, limit);
      res.write(`event: initialComments\n`);
      res.write(`data: ${JSON.stringify({
        type: 'initialComments',
        comments: latest,
        total: latest.length
      })}\n\n`);
      this.logger.debug(`Sent ${latest.length} initial comments for token: ${tokenAddress}`);
    } catch (error) {
      this.logger.error('Failed to send initial comments', error);
      res.write(`event: error\n`);
      res.write(`data: ${JSON.stringify({ 
        type: 'error', 
        message: 'Failed to load initial comments' 
      })}\n\n`);
    }

    // Subscribe to Redis for live updates
    const handler = (message: string) => {
      try {
        const payload = JSON.parse(message);
        if (payload?.type === 'newComment') {
          res.write(`event: newComment\n`);
          res.write(`data: ${JSON.stringify({
            type: 'newComment',
            comment: payload.comment
          })}\n\n`);
          this.logger.debug(`Sent new comment via SSE: ${payload.comment.id}`);
        }
      } catch (err) {
        this.logger.error('Failed to process comment message', err);
      }
    };
    
    this.redis.subscribe(channel, handler);

    // Handle client disconnect
    res.on('close', () => {
      this.logger.info(`Client disconnected from comments stream for ${tokenAddress}`);
      this.redis.unsubscribe(channel);
    });

    // Handle errors
    res.on('error', (error) => {
      this.logger.error('Comments SSE stream error', error);
      this.redis.unsubscribe(channel);
    });

    // Handle process termination
    process.on('SIGTERM', () => {
      this.logger.info('Process terminating, cleaning up SSE connections');
      this.redis.unsubscribe(channel);
      res.end();
    });
  }
}


