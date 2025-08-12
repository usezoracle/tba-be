import { IsString, IsIn, IsInt, Min, Max, IsEthereumAddress } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { EmojiType } from '../../infrastructure/events/definitions/emoji-reacted.event';

export class ReactEmojiDto {
  @ApiProperty({
    description: 'Token address to react to',
    example: '0x1234567890123456789012345678901234567890',
    type: String,
  })
  @IsString()
  @IsEthereumAddress()
  tokenAddress: string;

  @ApiProperty({
    description: 'Emoji type to react with',
    enum: ['like', 'love', 'laugh', 'wow', 'sad'],
    example: 'like',
  })
  @IsString()
  @IsIn(['like', 'love', 'laugh', 'wow', 'sad'])
  emoji: EmojiType;

  @ApiProperty({
    description: 'Increment value (1, 2, or 3)',
    minimum: 1,
    maximum: 3,
    example: 1,
  })
  @IsInt()
  @Min(1)
  @Max(3)
  increment: 1 | 2 | 3;
}
