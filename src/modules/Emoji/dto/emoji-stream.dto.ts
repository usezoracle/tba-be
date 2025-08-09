import { ApiProperty } from '@nestjs/swagger';

export class EmojiCountsDto {
  @ApiProperty({ example: '0', description: 'Total likes (string count)' })
  like!: string;

  @ApiProperty({ example: '0', description: 'Total loves (string count)' })
  love!: string;

  @ApiProperty({ example: '0', description: 'Total laughs (string count)' })
  laugh!: string;

  @ApiProperty({ example: '0', description: 'Total wows (string count)' })
  wow!: string;

  @ApiProperty({ example: '0', description: 'Total sads (string count)' })
  sad!: string;
}

export class EmojiConnectionEventDto {
  @ApiProperty({ example: 'connection' })
  type!: 'connection';

  @ApiProperty({ example: 'Connected to emoji stream' })
  message!: string;

  @ApiProperty({ example: '0x1234567890123456789012345678901234567890' })
  tokenAddress!: string;
}

export class EmojiInitialCountsEventDto {
  @ApiProperty({ example: 'initialEmojiCounts' })
  type!: 'initialEmojiCounts';

  @ApiProperty({ type: EmojiCountsDto })
  counts!: EmojiCountsDto;
}

export class EmojiCountUpdateEventDto {
  @ApiProperty({ example: 'emojiCountUpdate' })
  type!: 'emojiCountUpdate';

  @ApiProperty({ type: EmojiCountsDto })
  counts!: EmojiCountsDto;

  @ApiProperty({ example: 'like' })
  emoji!: 'like' | 'love' | 'laugh' | 'wow' | 'sad';

  @ApiProperty({ example: '12' })
  previousCount!: string;

  @ApiProperty({ example: '13' })
  newCount!: string;

  @ApiProperty({ example: 1712345678901, description: 'Unix ms timestamp' })
  timestamp!: number;
}


