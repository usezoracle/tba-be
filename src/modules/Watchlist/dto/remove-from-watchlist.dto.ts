import { IsString, IsEthereumAddress, IsArray, ArrayMinSize, ArrayMaxSize } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class RemoveFromWatchlistDto {
  @ApiProperty({
    description: 'User wallet address',
    example: '0x1234567890123456789012345678901234567890',
    type: String,
  })
  @IsString()
  @IsEthereumAddress()
  walletAddress: string;

  @ApiProperty({
    description: 'Array of token addresses to remove from watchlist',
    example: [
      '0xabc1234567890123456789012345678901234567',
      '0xdef4567890123456789012345678901234567890'
    ],
    type: [String],
    minItems: 1,
    maxItems: 50,
  })
  @IsArray()
  @ArrayMinSize(1, { message: 'At least one token address is required' })
  @ArrayMaxSize(50, { message: 'Maximum 50 tokens can be removed at once' })
  @IsEthereumAddress({ each: true })
  tokenAddresses: string[];
}

