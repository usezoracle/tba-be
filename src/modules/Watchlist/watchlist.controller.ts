import {
  Body,
  Controller,
  Get,
  Post,
  Delete,
  Query,
  Param,
  HttpCode,
  HttpStatus,
  BadRequestException,
} from '@nestjs/common';
import {
  ApiOperation,
  ApiResponse,
  ApiTags,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { PinoLogger } from 'nestjs-pino';
import { WatchlistService } from './services/watchlist.service';
import {
  AddToWatchlistDto,
  RemoveFromWatchlistDto,
  GetWatchlistDto,
} from './dto';

@ApiTags('watchlist')
@Controller('watchlist')
export class WatchlistController {
  constructor(
    private readonly watchlistService: WatchlistService,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(WatchlistController.name);
  }

  @Post('add')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Add tokens to user watchlist' })
  @ApiResponse({
    status: 201,
    description: 'Tokens successfully added to watchlist',
    schema: {
      example: {
        success: true,
        message: 'Successfully added 2 tokens to watchlist',
        addedCount: 2,
      },
    },
  })
  @ApiResponse({ status: 400, description: 'Invalid input data' })
  @ApiResponse({ status: 500, description: 'Internal server error' })
  async addToWatchlist(@Body() dto: AddToWatchlistDto) {
    try {
      this.logger.info('Adding tokens to watchlist', {
        walletAddress: dto.walletAddress,
        tokenCount: dto.tokenAddresses.length,
      });

      const result = await this.watchlistService.addToWatchlist(dto);
      return result;
    } catch (error) {
      this.logger.error('Failed to add tokens to watchlist', error);
      throw new BadRequestException(
        (error as Error)?.message || 'Failed to add tokens to watchlist',
      );
    }
  }

  @Delete('remove')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Remove tokens from user watchlist' })
  @ApiResponse({
    status: 200,
    description: 'Tokens successfully removed from watchlist',
    schema: {
      example: {
        success: true,
        message: 'Successfully removed 1 token from watchlist',
        removedCount: 1,
      },
    },
  })
  @ApiResponse({ status: 400, description: 'Invalid input data' })
  @ApiResponse({ status: 404, description: 'User not found' })
  @ApiResponse({ status: 500, description: 'Internal server error' })
  async removeFromWatchlist(@Body() dto: RemoveFromWatchlistDto) {
    try {
      this.logger.info('Removing tokens from watchlist', {
        walletAddress: dto.walletAddress,
        tokenCount: dto.tokenAddresses.length,
      });

      const result = await this.watchlistService.removeFromWatchlist(dto);
      return result;
    } catch (error) {
      this.logger.error('Failed to remove tokens from watchlist', error);
      throw new BadRequestException(
        (error as Error)?.message || 'Failed to remove tokens from watchlist',
      );
    }
  }

  @Get('get')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get user watchlist with pagination' })
  @ApiQuery({
    name: 'walletAddress',
    description: 'User wallet address',
    example: '0x1234567890123456789012345678901234567890',
  })
  @ApiQuery({
    name: 'page',
    description: 'Page number',
    required: false,
    example: 1,
  })
  @ApiQuery({
    name: 'limit',
    description: 'Items per page',
    required: false,
    example: 20,
  })
  @ApiResponse({
    status: 200,
    description: 'Watchlist retrieved successfully',
    schema: {
      example: {
        success: true,
        data: [
          {
            id: '1',
            userId: 'user123',
            tokenAddress: '0xabc1234567890123456789012345678901234567',
            addedAt: '2024-01-01T00:00:00.000Z',
            user: {
              id: 'user123',
              walletAddress: '0x1234567890123456789012345678901234567890',
            },
          },
        ],
        total: 1,
        page: 1,
        limit: 20,
        totalPages: 1,
      },
    },
  })
  @ApiResponse({ status: 400, description: 'Invalid input data' })
  @ApiResponse({ status: 404, description: 'User not found' })
  @ApiResponse({ status: 500, description: 'Internal server error' })
  async getWatchlist(@Query() dto: GetWatchlistDto) {
    try {
      this.logger.info('Getting watchlist', {
        walletAddress: dto.walletAddress,
        page: dto.page,
        limit: dto.limit,
      });

      const result = await this.watchlistService.getWatchlist(dto);
      return result;
    } catch (error) {
      this.logger.error('Failed to get watchlist', error);
      throw new BadRequestException(
        (error as Error)?.message || 'Failed to get watchlist',
      );
    }
  }

  @Get('check/:walletAddress/:tokenAddress')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Check if a token is in user watchlist' })
  @ApiParam({
    name: 'walletAddress',
    description: 'User wallet address',
    example: '0x1234567890123456789012345678901234567890',
  })
  @ApiParam({
    name: 'tokenAddress',
    description: 'Token address to check',
    example: '0xabc1234567890123456789012345678901234567',
  })
  @ApiResponse({
    status: 200,
    description: 'Check result',
    schema: {
      example: {
        success: true,
        isInWatchlist: true,
        message: 'Token is in watchlist',
      },
    },
  })
  @ApiResponse({ status: 400, description: 'Invalid addresses' })
  @ApiResponse({ status: 500, description: 'Internal server error' })
  async checkTokenInWatchlist(
    @Param('walletAddress') walletAddress: string,
    @Param('tokenAddress') tokenAddress: string,
  ) {
    try {
      this.logger.info('Checking if token is in watchlist', {
        walletAddress,
        tokenAddress,
      });

      const isInWatchlist = await this.watchlistService.isTokenInWatchlist(
        walletAddress,
        tokenAddress,
      );

      return {
        success: true,
        isInWatchlist,
        message: isInWatchlist
          ? 'Token is in watchlist'
          : 'Token is not in watchlist',
      };
    } catch (error) {
      this.logger.error('Failed to check token in watchlist', error);
      throw new BadRequestException(
        (error as Error)?.message || 'Failed to check token in watchlist',
      );
    }
  }

  @Get('count/:walletAddress')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get total count of tokens in user watchlist' })
  @ApiParam({
    name: 'walletAddress',
    description: 'User wallet address',
    example: '0x1234567890123456789012345678901234567890',
  })
  @ApiResponse({
    status: 200,
    description: 'Watchlist count retrieved successfully',
    schema: {
      example: {
        success: true,
        count: 5,
        message: 'User has 5 tokens in watchlist',
      },
    },
  })
  @ApiResponse({ status: 400, description: 'Invalid wallet address' })
  @ApiResponse({ status: 500, description: 'Internal server error' })
  async getWatchlistCount(@Param('walletAddress') walletAddress: string) {
    try {
      this.logger.info('Getting watchlist count', { walletAddress });

      const count = await this.watchlistService.getWatchlistCount(walletAddress);

      return {
        success: true,
        count,
        message: `User has ${count} tokens in watchlist`,
      };
    } catch (error) {
      this.logger.error('Failed to get watchlist count', error);
      throw new BadRequestException(
        (error as Error)?.message || 'Failed to get watchlist count',
      );
    }
  }
}

