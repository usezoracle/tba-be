import { ApiProperty } from '@nestjs/swagger';
import { TokenMetadata } from '../interfaces/token.interface';

// Base response interfaces for interceptors and filters
export interface SuccessResponse<T = any> {
  status: 'success';
  message?: string;
  data: T;
  meta?: any;
}

export interface ErrorResponse {
  status: 'error';
  error: {
    message: string;
    errorType: string;
  };
}

// Token-specific DTOs
export class TokenMetadataDto {
  @ApiProperty({ description: 'Unique pool identifier' })
  id: string;

  @ApiProperty({ description: 'Token name' })
  name: string;

  @ApiProperty({ description: 'Token symbol' })
  symbol: string;

  @ApiProperty({ description: 'Token decimals' })
  decimals: number;

  @ApiProperty({ description: 'Token contract address' })
  address: string;

  @ApiProperty({ description: 'Current price tick' })
  tick: number;

  @ApiProperty({ description: 'Raw price in sqrt format' })
  sqrtPriceX96: string;

  @ApiProperty({ description: 'Human-readable price' })
  price: string;

  @ApiProperty({ 
    description: 'Token type',
    enum: ['ZORA_CREATOR_COIN', 'ZORA_V4_COIN']
  })
  coinType: 'ZORA_CREATOR_COIN' | 'ZORA_V4_COIN';

  @ApiProperty({ 
    description: 'Application type',
    enum: ['ZORA', 'TBA']
  })
  appType: 'ZORA' | 'TBA';

  @ApiProperty({ description: 'Block number when pool was created' })
  blockNumber: string;

  @ApiProperty({ description: 'Unix timestamp' })
  timestamp: number;

  @ApiProperty({ description: 'ISO date string' })
  timestampISO: string;
}

export class TokensResponseDto {
  @ApiProperty({ 
    description: 'Response status',
    example: 'success'
  })
  status: 'success';

  @ApiProperty({ description: 'Success message' })
  message: string;

  @ApiProperty({ 
    description: 'Token data',
    type: Object
  })
  data: {
    tokens: TokenMetadata[];
    count: number;
    type: 'ALL' | 'ZORA' | 'TBA';
    metadata?: {
      lastUpdated: string;
      totalTokens: number;
      creatorCoins: number;
      v4Coins: number;
    };
  };
}

export class ScanResponseDto {
  @ApiProperty({ 
    description: 'Response status',
    example: 'success'
  })
  status: 'success';

  @ApiProperty({ description: 'Success message' })
  message: string;

  @ApiProperty({ 
    description: 'Scan result data',
    type: Object
  })
  data: {
    tokensFound: number;
    zoraTokens: number;
    tbaTokens: number;
    scanDuration: number;
    timestamp: string;
  };
}