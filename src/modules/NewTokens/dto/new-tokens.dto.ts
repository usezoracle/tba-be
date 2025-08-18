import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsNumber, Min, Max, IsString, IsEthereumAddress } from 'class-validator';

// ============================================================================
// GET TOKENS DTO
// ============================================================================

export class GetTokensDto {
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
    description: 'Number of tokens per page (maximum 100)',
    example: 30,
    minimum: 1,
    maximum: 100,
    default: 30,
    required: false
  })
  @IsOptional()
  @IsNumber()
  @Min(1, { message: 'Limit must be at least 1' })
  @Max(100, { message: 'Limit cannot exceed 100' })
  limit?: number = 30;

  @ApiProperty({
    description: 'Absolute offset into newest-first list (use with SSE snapshot length for seamless paging)',
    example: 100,
    minimum: 0,
    required: false
  })
  @IsOptional()
  @IsNumber()
  @Min(0, { message: 'Offset must be at least 0' })
  offset?: number;
}

// ============================================================================
// TOKEN SEARCH DTO
// ============================================================================

export class SearchTokensDto {
  @ApiProperty({
    description: 'Search query for token name, symbol, or address',
    example: 'zora',
    required: false
  })
  @IsOptional()
  @IsString()
  query?: string;

  @ApiProperty({
    description: 'Specific token address to search for',
    example: '0x1234567890123456789012345678901234567890',
    pattern: '^0x[a-fA-F0-9]{40}$',
    required: false
  })
  @IsOptional()
  @IsEthereumAddress({ message: 'Token address must be a valid Ethereum address' })
  address?: string;

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
    description: 'Number of tokens per page (maximum 100)',
    example: 30,
    minimum: 1,
    maximum: 100,
    default: 30,
    required: false
  })
  @IsOptional()
  @IsNumber()
  @Min(1, { message: 'Limit must be at least 1' })
  @Max(100, { message: 'Limit cannot exceed 100' })
  limit?: number = 30;
}

// ============================================================================
// RESPONSE SCHEMAS
// ============================================================================

export class TokenMetadataResponse {
  @ApiProperty({
    description: 'Token contract address',
    example: '0x1234567890123456789012345678901234567890'
  })
  address: string;

  @ApiProperty({
    description: 'Token name',
    example: 'Zora Protocol Token'
  })
  name: string;

  @ApiProperty({
    description: 'Token symbol',
    example: 'ZORA'
  })
  symbol: string;

  @ApiProperty({
    description: 'Token decimals',
    example: 18
  })
  decimals: number;

  @ApiProperty({
    description: 'Total supply of the token',
    example: '1000000000000000000000000'
  })
  totalSupply: string;

  @ApiProperty({
    description: 'Token logo URL',
    example: 'https://example.com/logo.png',
    required: false
  })
  logo?: string;

  @ApiProperty({
    description: 'Token description',
    example: 'The native token of the Zora Protocol',
    required: false
  })
  description?: string;

  @ApiProperty({
    description: 'Token website URL',
    example: 'https://zora.co',
    required: false
  })
  website?: string;

  @ApiProperty({
    description: 'Token social media links',
    type: 'object',
    properties: {
      twitter: { type: 'string', example: 'https://twitter.com/zoraprotocol' },
      discord: { type: 'string', example: 'https://discord.gg/zora' },
      telegram: { type: 'string', example: 'https://t.me/zoraprotocol' }
    },
    required: false
  })
  social?: {
    twitter?: string;
    discord?: string;
    telegram?: string;
  };

  @ApiProperty({
    description: 'When the token was first detected',
    example: '2025-08-15T18:00:00.000Z'
  })
  firstSeen: string;

  @ApiProperty({
    description: 'When the token was last updated',
    example: '2025-08-15T18:00:00.000Z'
  })
  lastUpdated: string;

  @ApiProperty({
    description: 'Token verification status',
    example: 'verified',
    enum: ['verified', 'unverified', 'suspicious']
  })
  verificationStatus: 'verified' | 'unverified' | 'suspicious';

  @ApiProperty({
    description: 'Token market data',
    type: 'object',
    properties: {
      price: { type: 'string', example: '0.001234' },
      marketCap: { type: 'string', example: '1234567' },
      volume24h: { type: 'string', example: '98765' },
      priceChange24h: { type: 'string', example: '5.67' }
    },
    required: false
  })
  marketData?: {
    price?: string;
    marketCap?: string;
    volume24h?: string;
    priceChange24h?: string;
  };

  @ApiProperty({
    description: 'Token contract verification details',
    type: 'object',
    properties: {
      verified: { type: 'boolean', example: true },
      compilerVersion: { type: 'string', example: 'v0.8.19' },
      optimizationUsed: { type: 'boolean', example: true },
      runs: { type: 'number', example: 200 }
    },
    required: false
  })
  contractVerification?: {
    verified: boolean;
    compilerVersion?: string;
    optimizationUsed?: boolean;
    runs?: number;
  };
}

export class PaginatedTokensResponse {
  @ApiProperty({
    description: 'Array of tokens',
    type: [TokenMetadataResponse]
  })
  data: TokenMetadataResponse[];

  @ApiProperty({
    description: 'Pagination metadata',
    type: 'object',
    properties: {
      total: { type: 'number', example: 1250 },
      page: { type: 'number', example: 1 },
      limit: { type: 'number', example: 30 },
      totalPages: { type: 'number', example: 42 },
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

export class TokenSearchResponse {
  @ApiProperty({
    description: 'Array of matching tokens',
    type: [TokenMetadataResponse]
  })
  data: TokenMetadataResponse[];

  @ApiProperty({
    description: 'Total number of matching tokens',
    example: 45
  })
  total: number;

  @ApiProperty({
    description: 'Search query used',
    example: 'zora'
  })
  query: string;

  @ApiProperty({
    description: 'Pagination metadata',
    type: 'object',
    properties: {
      total: { type: 'number', example: 45 },
      page: { type: 'number', example: 1 },
      limit: { type: 'number', example: 30 },
      totalPages: { type: 'number', example: 2 },
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

// ============================================================================
// TOKEN STATISTICS SCHEMAS
// ============================================================================

export class TokenStatisticsResponse {
  @ApiProperty({
    description: 'Total number of tokens in the system',
    example: 1250
  })
  totalTokens: number;

  @ApiProperty({
    description: 'Number of verified tokens',
    example: 890
  })
  verifiedTokens: number;

  @ApiProperty({
    description: 'Number of unverified tokens',
    example: 360
  })
  unverifiedTokens: number;

  @ApiProperty({
    description: 'Number of suspicious tokens',
    example: 5
  })
  suspiciousTokens: number;

  @ApiProperty({
    description: 'Tokens added in the last 24 hours',
    example: 25
  })
  tokensLast24h: number;

  @ApiProperty({
    description: 'Tokens added in the last 7 days',
    example: 150
  })
  tokensLast7d: number;

  @ApiProperty({
    description: 'Tokens added in the last 30 days',
    example: 500
  })
  tokensLast30d: number;

  @ApiProperty({
    description: 'Most active token categories',
    type: 'object',
    properties: {
      'DeFi': { type: 'number', example: 300 },
      'NFT': { type: 'number', example: 250 },
      'Gaming': { type: 'number', example: 200 },
      'Infrastructure': { type: 'number', example: 150 }
    }
  })
  categories: Record<string, number>;

  @ApiProperty({
    description: 'When the statistics were last updated',
    example: '2025-08-15T18:00:00.000Z'
  })
  lastUpdated: string;
}

// ============================================================================
// TOKEN VERIFICATION SCHEMAS
// ============================================================================

export class TokenVerificationRequest {
  @ApiProperty({
    description: 'Token contract address to verify',
    example: '0x1234567890123456789012345678901234567890',
    pattern: '^0x[a-fA-F0-9]{40}$'
  })
  @IsString()
  @IsEthereumAddress({ message: 'Token address must be a valid Ethereum address' })
  address: string;
}

export class TokenVerificationResponse {
  @ApiProperty({
    description: 'Token contract address',
    example: '0x1234567890123456789012345678901234567890'
  })
  address: string;

  @ApiProperty({
    description: 'Verification status',
    example: 'pending',
    enum: ['pending', 'verified', 'failed']
  })
  status: 'pending' | 'verified' | 'failed';

  @ApiProperty({
    description: 'Verification details',
    type: 'object',
    properties: {
      verified: { type: 'boolean', example: true },
      compilerVersion: { type: 'string', example: 'v0.8.19' },
      optimizationUsed: { type: 'boolean', example: true },
      runs: { type: 'number', example: 200 },
      sourceCode: { type: 'string', example: '// SPDX-License-Identifier: MIT...' }
    },
    required: false
  })
  details?: {
    verified: boolean;
    compilerVersion?: string;
    optimizationUsed?: boolean;
    runs?: number;
    sourceCode?: string;
  };

  @ApiProperty({
    description: 'Verification timestamp',
    example: '2025-08-15T18:00:00.000Z'
  })
  verifiedAt: string;

  @ApiProperty({
    description: 'Verification error message (if failed)',
    example: 'Source code verification failed',
    required: false
  })
  error?: string;
}
