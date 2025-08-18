import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsEthereumAddress, IsNotEmpty, MaxLength, IsOptional, IsNumber, Min, Max } from 'class-validator';

// ============================================================================
// CREATE COMMENT DTO
// ============================================================================

export class CreateCommentDto {
  @ApiProperty({
    description: 'User wallet address (Ethereum address)',
    example: '0x1234567890123456789012345678901234567890',
    pattern: '^0x[a-fA-F0-9]{40}$'
  })
  @IsString()
  @IsEthereumAddress({ message: 'Wallet address must be a valid Ethereum address' })
  walletAddress: string;

  @ApiProperty({
    description: 'Token address to comment on',
    example: '0xabcdef1234567890abcdef1234567890abcdef12',
    pattern: '^0x[a-fA-F0-9]{40}$'
  })
  @IsString()
  @IsEthereumAddress({ message: 'Token address must be a valid Ethereum address' })
  tokenAddress: string;

  @ApiProperty({
    description: 'Comment content (maximum 500 characters)',
    example: 'This token is promising! I love the project vision.',
    maxLength: 500
  })
  @IsString()
  @IsNotEmpty({ message: 'Comment content is required' })
  @MaxLength(500, { message: 'Comment cannot exceed 500 characters' })
  content: string;
}

// ============================================================================
// GET COMMENTS DTO
// ============================================================================

export class GetCommentsDto {
  @ApiProperty({
    description: 'Token address to get comments for',
    example: '0xabcdef1234567890abcdef1234567890abcdef12',
    pattern: '^0x[a-fA-F0-9]{40}$'
  })
  @IsString()
  @IsEthereumAddress({ message: 'Token address must be a valid Ethereum address' })
  tokenAddress: string;

  @ApiProperty({
    description: 'Number of comments to return (default: 50, maximum: 100)',
    example: 50,
    minimum: 1,
    maximum: 100,
    default: 50,
    required: false
  })
  @IsOptional()
  @IsNumber()
  @Min(1, { message: 'Limit must be at least 1' })
  @Max(100, { message: 'Limit cannot exceed 100' })
  limit?: number = 50;
}

// ============================================================================
// STREAM COMMENTS DTO
// ============================================================================

export class StreamCommentsDto {
  @ApiProperty({
    description: 'Token address to stream comments for',
    example: '0xabcdef1234567890abcdef1234567890abcdef12',
    pattern: '^0x[a-fA-F0-9]{40}$'
  })
  @IsString()
  @IsEthereumAddress({ message: 'Token address must be a valid Ethereum address' })
  tokenAddress: string;

  @ApiProperty({
    description: 'Number of initial comments to send (default: 50, maximum: 100)',
    example: 50,
    minimum: 1,
    maximum: 100,
    default: 50,
    required: false
  })
  @IsOptional()
  @IsNumber()
  @Min(1, { message: 'Initial count must be at least 1' })
  @Max(100, { message: 'Initial count cannot exceed 100' })
  initial?: number = 50;
}

// ============================================================================
// RESPONSE SCHEMAS
// ============================================================================

export class CommentUserResponse {
  @ApiProperty({
    description: 'User ID',
    example: 'd503e8b0-5032-40c3-b703-c2560ad5a96c'
  })
  id: string;

  @ApiProperty({
    description: 'User wallet address',
    example: '0x1234567890123456789012345678901234567890'
  })
  walletAddress: string;
}

export class CommentResponse {
  @ApiProperty({
    description: 'Unique comment identifier',
    example: 'comment_1755280863475_23ny35ew0'
  })
  id: string;

  @ApiProperty({
    description: 'Comment content',
    example: 'This token is promising! I love the project vision.'
  })
  content: string;

  @ApiProperty({
    description: 'Token address the comment is about',
    example: '0xabcdef1234567890abcdef1234567890abcdef12'
  })
  tokenAddress: string;

  @ApiProperty({
    description: 'User ID who wrote the comment',
    example: 'd503e8b0-5032-40c3-b703-c2560ad5a96c'
  })
  userId: string;

  @ApiProperty({
    description: 'User information',
    type: CommentUserResponse
  })
  user: CommentUserResponse;

  @ApiProperty({
    description: 'When the comment was created',
    example: '2025-08-15T18:01:03.477Z'
  })
  createdAt: string;

  @ApiProperty({
    description: 'Comment processing status',
    example: 'processing',
    enum: ['processing', 'completed', 'failed']
  })
  status: string;
}

export class CreateCommentResponse {
  @ApiProperty({
    description: 'Unique comment identifier',
    example: 'comment_1755280863475_23ny35ew0'
  })
  id: string;

  @ApiProperty({
    description: 'Comment content',
    example: 'This token is promising! I love the project vision.'
  })
  content: string;

  @ApiProperty({
    description: 'Token address the comment is about',
    example: '0xabcdef1234567890abcdef1234567890abcdef12'
  })
  tokenAddress: string;

  @ApiProperty({
    description: 'User ID who wrote the comment',
    example: 'd503e8b0-5032-40c3-b703-c2560ad5a96c'
  })
  userId: string;

  @ApiProperty({
    description: 'User information',
    type: CommentUserResponse
  })
  user: CommentUserResponse;

  @ApiProperty({
    description: 'When the comment was created',
    example: '2025-08-15T18:01:03.477Z'
  })
  createdAt: string;

  @ApiProperty({
    description: 'Comment processing status',
    example: 'processing',
    enum: ['processing', 'completed', 'failed']
  })
  status: string;
}

export class GetCommentsResponse {
  @ApiProperty({
    description: 'Array of comments',
    type: [CommentResponse]
  })
  data: CommentResponse[];

  @ApiProperty({
    description: 'Total number of comments available',
    example: 25
  })
  total: number;
}

// ============================================================================
// SSE EVENT SCHEMAS
// ============================================================================

export class CommentConnectionEvent {
  @ApiProperty({
    description: 'Event type',
    example: 'connection'
  })
  type: string;

  @ApiProperty({
    description: 'Connection message',
    example: 'Connected to comments stream'
  })
  message: string;

  @ApiProperty({
    description: 'Token address being streamed',
    example: '0xabcdef1234567890abcdef1234567890abcdef12'
  })
  tokenAddress: string;
}

export class CommentInitialEvent {
  @ApiProperty({
    description: 'Event type',
    example: 'initialComments'
  })
  type: string;

  @ApiProperty({
    description: 'Array of initial comments',
    type: [CommentResponse]
  })
  comments: CommentResponse[];

  @ApiProperty({
    description: 'Total number of initial comments',
    example: 25
  })
  total: number;
}

export class CommentNewEvent {
  @ApiProperty({
    description: 'Event type',
    example: 'newComment'
  })
  type: string;

  @ApiProperty({
    description: 'New comment data',
    type: CommentResponse
  })
  comment: CommentResponse;
}

export class CommentErrorEvent {
  @ApiProperty({
    description: 'Event type',
    example: 'error'
  })
  type: string;

  @ApiProperty({
    description: 'Error message',
    example: 'Failed to load initial comments'
  })
  message: string;
}
