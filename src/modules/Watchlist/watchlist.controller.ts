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
import {
  AddToWatchlistParams,
  RemoveFromWatchlistParams,
  GetWatchlistParams,
} from './interfaces/watchlist.interfaces';
import { ApiMessage, ApiStandardResponses } from '../../common/decorators';
import { ApiPagination } from '../../common/decorators/api-pagination.decorator';

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
  @ApiMessage('Tokens successfully added to watchlist')
  @ApiStandardResponses(true)
  async addToWatchlist(@Body() dto: AddToWatchlistDto) {
    this.logger.info('Adding tokens to watchlist', {
      walletAddress: dto.walletAddress,
      tokenCount: dto.tokenAddresses.length,
    });
    return this.watchlistService.addToWatchlist(dto);
  }

  @Delete('remove')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Remove tokens from user watchlist' })
  @ApiMessage('Tokens successfully removed from watchlist')
  @ApiStandardResponses()
  async removeFromWatchlist(@Body() dto: RemoveFromWatchlistDto) {
    this.logger.info('Removing tokens from watchlist', {
      walletAddress: dto.walletAddress,
      tokenCount: dto.tokenAddresses.length,
    });
    return this.watchlistService.removeFromWatchlist(dto);
  }

  @Get('get')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get user watchlist with pagination' })
  @ApiMessage('Watchlist retrieved successfully')
  @ApiPagination()
  @ApiStandardResponses()
  @ApiQuery({
    name: 'walletAddress',
    description: 'User wallet address',
    example: '0x1234567890123456789012345678901234567890',
  })
  async getWatchlist(@Query() dto: GetWatchlistDto) {
    this.logger.info('Getting watchlist', {
      walletAddress: dto.walletAddress,
      page: dto.page,
      limit: dto.limit,
    });
    return this.watchlistService.getWatchlist(dto);
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
  @ApiMessage('Check result retrieved successfully')
  @ApiStandardResponses()
  async checkTokenInWatchlist(
    @Param('walletAddress') walletAddress: string,
    @Param('tokenAddress') tokenAddress: string,
  ) {
    this.logger.info('Checking if token is in watchlist', {
      walletAddress,
      tokenAddress,
    });
    return this.watchlistService.isTokenInWatchlist(walletAddress, tokenAddress);
  }

  @Get('count/:walletAddress')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get total count of tokens in user watchlist' })
  @ApiParam({
    name: 'walletAddress',
    description: 'User wallet address',
    example: '0x1234567890123456789012345678901234567890',
  })
  @ApiMessage('Watchlist count retrieved successfully')
  @ApiStandardResponses()
  async getWatchlistCount(@Param('walletAddress') walletAddress: string) {
    this.logger.info('Getting watchlist count', { walletAddress });
    return this.watchlistService.getWatchlistCount(walletAddress);
  }
}

