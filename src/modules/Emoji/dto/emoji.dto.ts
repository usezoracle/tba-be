import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsEthereumAddress, IsIn, IsInt, Min, Max } from 'class-validator';

// ============================================================================
// REACT EMOJI DTO
// ============================================================================

export class ReactEmojiDto {
  @ApiProperty({
    description: 'Token address to react to',
    example: '0xabcdef1234567890abcdef1234567890abcdef12',
    pattern: '^0x[a-fA-F0-9]{40}$'
  })
  @IsString()
  @IsEthereumAddress({ message: 'Token address must be a valid Ethereum address' })
  tokenAddress: string;

  @ApiProperty({
    description: 'Emoji reaction type - Available emoji reactions: like, love, laugh, wow, sad',
    example: 'like',
    enum: ['like', 'love', 'laugh', 'wow', 'sad']
  })
  @IsString()
  @IsIn(['like', 'love', 'laugh', 'wow', 'sad'], { 
    message: 'Emoji must be one of the following values: like, love, laugh, wow, sad' 
  })
  emoji: 'like' | 'love' | 'laugh' | 'wow' | 'sad';

  @ApiProperty({
    description: 'Reaction increment value (1-3) - Available increment values: 1 (single), 2 (double), 3 (triple)',
    example: 1,
    minimum: 1,
    maximum: 3,
    enum: [1, 2, 3]
  })
  @IsInt()
  @Min(1, { message: 'Increment must be at least 1' })
  @Max(3, { message: 'Increment cannot exceed 3' })
  increment: 1 | 2 | 3;
}

// ============================================================================
// GET EMOJI COUNTS DTO
// ============================================================================

export class GetEmojiCountsDto {
  @ApiProperty({
    description: 'Token address to get emoji counts for',
    example: '0xabcdef1234567890abcdef1234567890abcdef12',
    pattern: '^0x[a-fA-F0-9]{40}$'
  })
  @IsString()
  @IsEthereumAddress({ message: 'Token address must be a valid Ethereum address' })
  tokenAddress: string;
}

// ============================================================================
// STREAM EMOJI DTO
// ============================================================================

export class StreamEmojiDto {
  @ApiProperty({
    description: 'Token address to stream emoji reactions for',
    example: '0xabcdef1234567890abcdef1234567890abcdef12',
    pattern: '^0x[a-fA-F0-9]{40}$'
  })
  @IsString()
  @IsEthereumAddress({ message: 'Token address must be a valid Ethereum address' })
  tokenAddress: string;
}

// ============================================================================
// RESPONSE SCHEMAS
// ============================================================================

export class EmojiReactionResponse {
  @ApiProperty({
    description: 'Unique emoji reaction identifier',
    example: 'emoji_1755280868597_5c2mgorac'
  })
  id: string;

  @ApiProperty({
    description: 'Token address the reaction is for',
    example: '0xabcdef1234567890abcdef1234567890abcdef12'
  })
  tokenAddress: string;

  @ApiProperty({
    description: 'Emoji reaction type',
    example: 'like',
    enum: ['like', 'love', 'laugh', 'wow', 'sad']
  })
  emoji: 'like' | 'love' | 'laugh' | 'wow' | 'sad';

  @ApiProperty({
    description: 'Reaction increment value',
    example: 1,
    enum: [1, 2, 3]
  })
  increment: 1 | 2 | 3;

  @ApiProperty({
    description: 'Reaction processing status',
    example: 'processing',
    enum: ['processing', 'completed', 'failed']
  })
  status: string;
}

export class EmojiCountsResponse {
  @ApiProperty({
    description: 'Number of like reactions',
    example: '5'
  })
  like: string;

  @ApiProperty({
    description: 'Number of love reactions',
    example: '3'
  })
  love: string;

  @ApiProperty({
    description: 'Number of laugh reactions',
    example: '1'
  })
  laugh: string;

  @ApiProperty({
    description: 'Number of wow reactions',
    example: '2'
  })
  wow: string;

  @ApiProperty({
    description: 'Number of sad reactions',
    example: '0'
  })
  sad: string;
}

// ============================================================================
// SSE EVENT SCHEMAS
// ============================================================================

export class EmojiConnectionEvent {
  @ApiProperty({
    description: 'Event type',
    example: 'connection'
  })
  type: string;

  @ApiProperty({
    description: 'Connection message',
    example: 'Connected to emoji stream'
  })
  message: string;

  @ApiProperty({
    description: 'Token address being streamed',
    example: '0xabcdef1234567890abcdef1234567890abcdef12'
  })
  tokenAddress: string;
}

export class EmojiInitialEvent {
  @ApiProperty({
    description: 'Event type',
    example: 'initialEmojiCounts'
  })
  type: string;

  @ApiProperty({
    description: 'Initial emoji counts',
    type: EmojiCountsResponse
  })
  counts: EmojiCountsResponse;
}

export class EmojiCountUpdateEvent {
  @ApiProperty({
    description: 'Event type',
    example: 'emojiCountUpdate'
  })
  type: string;

  @ApiProperty({
    description: 'Updated emoji counts',
    type: EmojiCountsResponse
  })
  counts: EmojiCountsResponse;

  @ApiProperty({
    description: 'Token address that was updated',
    example: '0xabcdef1234567890abcdef1234567890abcdef12'
  })
  tokenAddress: string;

  @ApiProperty({
    description: 'Timestamp of the update',
    example: '2025-08-15T18:01:00.000Z'
  })
  timestamp: string;
}

export class EmojiErrorEvent {
  @ApiProperty({
    description: 'Event type',
    example: 'error'
  })
  type: string;

  @ApiProperty({
    description: 'Error message',
    example: 'Failed to load initial counts'
  })
  message: string;
}

// ============================================================================
// EMOJI TYPE DEFINITIONS
// ============================================================================

export type EmojiType = 'like' | 'love' | 'laugh' | 'wow' | 'sad';
export type EmojiIncrement = 1 | 2 | 3;

export const EMOJI_TYPES: EmojiType[] = ['like', 'love', 'laugh', 'wow', 'sad'];
export const EMOJI_INCREMENTS: EmojiIncrement[] = [1, 2, 3];

export const EMOJI_DESCRIPTIONS: Record<EmojiType, string> = {
  like: '👍 Like reaction',
  love: '❤️ Love reaction', 
  laugh: '😂 Laugh reaction',
  wow: '😮 Wow reaction',
  sad: '😢 Sad reaction'
};

export const EMOJI_INCREMENT_DESCRIPTIONS: Record<EmojiIncrement, string> = {
  1: 'Single reaction',
  2: 'Double reaction',
  3: 'Triple reaction'
};
