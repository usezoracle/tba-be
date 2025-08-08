import { 
  Body, 
  Controller, 
  Get, 
  Param, 
  Post, 
  Res,
  HttpCode,
  HttpStatus,
  BadRequestException,
} from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Response } from 'express';
import { EmojiService, ReactEmojiDto } from './services/emoji.service';
import { PinoLogger } from 'nestjs-pino';
import { RedisService } from '../infrastructure/redis/redis.service';

@ApiTags('emoji')
@Controller('emoji')
export class EmojiController {
  constructor(
    private readonly emoji: EmojiService,
    private readonly redis: RedisService,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(EmojiController.name);
  }

  @Post('react')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'React with an emoji' })
  @ApiResponse({ 
    status: 201, 
    description: 'Emoji reaction processed',
    schema: {
      example: {
        success: true,
        data: {
          id: 'emoji_1234567890_abc123',
          tokenAddress: '0xabc123...',
          emoji: 'like',
          increment: 1,
          status: 'processing'
        }
      }
    }
  })
  @ApiResponse({ status: 400, description: 'Invalid emoji type or increment value' })
  async react(@Body() dto: ReactEmojiDto) {
    try {
      const result = await this.emoji.react(dto);
      return { success: true, data: result };
    } catch (error) {
      this.logger.error('Failed to process emoji reaction', error);
      throw new BadRequestException(error.message);
    }
  }

  @Get('stream/:tokenAddress')
  @ApiOperation({ summary: 'Stream emoji reactions for a token via Server-Sent Events' })
  @ApiResponse({ status: 200, description: 'SSE stream of emoji reactions' })
  async stream(
    @Param('tokenAddress') tokenAddress: string,
    @Res() res: Response,
  ) {
    const channel = `emojiUpdates:${tokenAddress.toLowerCase()}`;
    
    this.logger.info(`Starting SSE stream for emoji reactions on token: ${tokenAddress}`);

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
      message: 'Connected to emoji stream',
      tokenAddress: tokenAddress.toLowerCase()
    })}\n\n`);

    // Send initial counts
    try {
      const counts = await this.emoji.getCounts(tokenAddress);
      res.write(`event: initialEmojiCounts\n`);
      res.write(`data: ${JSON.stringify({
        type: 'initialEmojiCounts',
        counts
      })}\n\n`);
      this.logger.debug(`Sent initial emoji counts for token: ${tokenAddress}`);
    } catch (error) {
      this.logger.error('Failed to send initial emoji counts', error);
      res.write(`event: error\n`);
      res.write(`data: ${JSON.stringify({ 
        type: 'error', 
        message: 'Failed to load initial counts' 
      })}\n\n`);
    }

    // Subscribe to Redis for live updates
    const handler = (message: string) => {
      try {
        const payload = JSON.parse(message);
        if (payload?.type === 'emojiCountUpdate') {
          res.write(`event: emojiCountUpdate\n`);
          res.write(`data: ${JSON.stringify(payload)}\n\n`);
          this.logger.debug(`Sent emoji count update for token: ${tokenAddress}`);
        }
      } catch (err) {
        this.logger.error('Failed to process emoji update message', err);
      }
    };
    
    this.redis.subscribe(channel, handler);

    // Handle client disconnect
    res.on('close', () => {
      this.logger.info(`Client disconnected from emoji stream for ${tokenAddress}`);
      this.redis.unsubscribe(channel);
    });

    // Handle errors
    res.on('error', (error) => {
      this.logger.error('Emoji SSE stream error', error);
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
