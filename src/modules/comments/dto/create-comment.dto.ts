import { IsString, IsEthereumAddress, MinLength, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateCommentDto {
  @ApiProperty({
    description: 'Token address to comment on',
    example: '0x1234567890123456789012345678901234567890',
    type: String,
  })
  @IsString()
  @IsEthereumAddress()
  tokenAddress: string;

  @ApiProperty({
    description: 'User wallet address',
    example: '0x1234567890123456789012345678901234567890',
    type: String,
  })
  @IsString()
  @IsEthereumAddress()
  walletAddress: string;

  @ApiProperty({
    description: 'Comment content',
    example: 'This token is really promising!',
    minLength: 1,
    maxLength: 500,
  })
  @IsString()
  @MinLength(1)
  @MaxLength(500)
  content: string;
}

