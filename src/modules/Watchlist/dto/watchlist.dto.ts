import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsArray, ArrayMinSize, ArrayMaxSize, IsEthereumAddress, IsOptional, IsNumber, Min, Max } from 'class-validator';

// ============================================================================
// ADD TO WATCHLIST DTO
// ============================================================================

export class AddToWatchlistDto {
  @ApiProperty({
    description: 'User wallet address (Ethereum address)',
    example: '0x1234567890123456789012345678901234567890',
    pattern: '^0x[a-fA-F0-9]{40}$'
  })
  @IsString()
  @IsEthereumAddress()
  walletAddress: string;

  @ApiProperty({
    description: 'Array of token addresses to add to watchlist',
    example: [
      '0x1234567890123456789012345678901234567890',
      '0xabcdef1234567890abcdef1234567890abcdef12'
    ],
    type: [String],
    minItems: 1,
    maxItems: 50
  })
  @IsArray()
  @ArrayMinSize(1, { message: 'At least one token address is required' })
  @ArrayMaxSize(50, { message: 'Maximum 50 tokens can be added at once' })
  @IsEthereumAddress({ each: true, message: 'Each token address must be a valid Ethereum address' })
  tokenAddresses: string[];
}

// ============================================================================
// REMOVE FROM WATCHLIST DTO
// ============================================================================

export class RemoveFromWatchlistDto {
  @ApiProperty({
    description: 'User wallet address (Ethereum address)',
    example: '0x1234567890123456789012345678901234567890',
    pattern: '^0x[a-fA-F0-9]{40}$'
  })
  @IsString()
  @IsEthereumAddress()
  walletAddress: string;

  @ApiProperty({
    description: 'Array of token addresses to remove from watchlist',
    example: [
      '0x1234567890123456789012345678901234567890',
      '0xabcdef1234567890abcdef1234567890abcdef12'
    ],
    type: [String],
    minItems: 1,
    maxItems: 50
  })
  @IsArray()
  @ArrayMinSize(1, { message: 'At least one token address is required' })
  @ArrayMaxSize(50, { message: 'Maximum 50 tokens can be removed at once' })
  @IsEthereumAddress({ each: true, message: 'Each token address must be a valid Ethereum address' })
  tokenAddresses: string[];
}

// ============================================================================
// GET WATCHLIST DTO
// ============================================================================

export class GetWatchlistDto {
  @ApiProperty({
    description: 'User wallet address (Ethereum address)',
    example: '0x1234567890123456789012345678901234567890',
    pattern: '^0x[a-fA-F0-9]{40}$'
  })
  @IsString()
  @IsEthereumAddress()
  walletAddress: string;

  @ApiProperty({
    description: 'Page number for pagination (starts from 1)',
    example: 1,
    minimum: 1,
    default: 1,
    required: false
  })
  @IsOptional()
  @IsNumber()
  @Min(1, { message: 'Page must be at least 1' })
  page?: number = 1;

  @ApiProperty({
    description: 'Number of items per page (maximum 100)',
    example: 10,
    minimum: 1,
    maximum: 100,
    default: 10,
    required: false
  })
  @IsOptional()
  @IsNumber()
  @Min(1, { message: 'Limit must be at least 1' })
  @Max(100, { message: 'Limit cannot exceed 100' })
  limit?: number = 10;
}

// ============================================================================
// RESPONSE SCHEMAS
// ============================================================================

export class WatchlistItemDto {
  @ApiProperty({
    description: 'Unique identifier for the watchlist item',
    example: 'cmed4mxfn0000pkqufeufw0on'
  })
  id: string;

  @ApiProperty({
    description: 'Token address being watched',
    example: '0x1234567890123456789012345678901234567890'
  })
  tokenAddress: string;

  @ApiProperty({
    description: 'User ID who owns this watchlist item',
    example: 'd503e8b0-5032-40c3-b703-c2560ad5a96c'
  })
  userId: string;

  @ApiProperty({
    description: 'When the item was added to watchlist',
    example: '2025-08-15T17:53:31.332Z'
  })
  createdAt: string;

  @ApiProperty({
    description: 'When the item was last updated',
    example: '2025-08-15T17:53:31.332Z'
  })
  updatedAt: string;

  @ApiProperty({
    description: 'User information',
    type: 'object',
    properties: {
      id: { type: 'string', example: 'd503e8b0-5032-40c3-b703-c2560ad5a96c' },
      walletAddress: { type: 'string', example: '0x1234567890123456789012345678901234567890' }
    }
  })
  user: {
    id: string;
    walletAddress: string;
  };
}

export class AddToWatchlistDtoResponse {
  @ApiProperty({
    description: 'Number of tokens successfully added',
    example: 2
  })
  addedCount: number;
}

export class RemoveFromWatchlistDtoResponse {
  @ApiProperty({
    description: 'Number of tokens successfully removed',
    example: 1
  })
  removedCount: number;
}

export class PaginatedWatchlistDtoResponse {
  @ApiProperty({
    description: 'Array of watchlist items',
    type: [WatchlistItemDto]
  })
  data: WatchlistItemDto[];

  @ApiProperty({
    description: 'Pagination metadata',
    type: 'object',
    properties: {
      total: { type: 'number', example: 25 },
      page: { type: 'number', example: 1 },
      limit: { type: 'number', example: 10 },
      totalPages: { type: 'number', example: 3 },
      skip: { type: 'number', example: 0 }
    }
  })
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    skip: number;
  };
}
