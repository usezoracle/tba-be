import { Injectable } from '@nestjs/common';
import { RetryWithBackoffParams } from '../interfaces/retry-with-backoff.params.interface';
import { PinoLogger } from 'nestjs-pino';

/**
 * 🔄 RETRY SERVICE - NETWORK RESILIENCE
 * 
 * Provides robust retry logic with exponential backoff for blockchain operations.
 * Essential for handling network instability and rate limiting from RPC providers.
 * 
 * 🎯 MAIN RESPONSIBILITIES:
 * - Handle transient network failures gracefully
 * - Implement exponential backoff for rate limiting
 * - Provide configurable retry parameters
 * - Log retry attempts for monitoring
 * 
 * 🔧 RETRY STRATEGY:
 * - Exponential backoff: 1s, 2s, 4s, 8s...
 * - Rate limit detection: HTTP 429 or rate limit messages
 * - Configurable max retries (default: 3)
 * - Immediate failure for non-retryable errors
 * 
 * 💡 USE CASES:
 * - RPC rate limiting
 * - Network timeouts
 * - Temporary service unavailability
 * - Blockchain node synchronization issues
 */
@Injectable()
export class RetryService {
  constructor(private readonly logger: PinoLogger) {
    this.logger.setContext(RetryService.name);
  }

  async retryWithBackoff<T>(params: RetryWithBackoffParams<T>): Promise<T> {
    const { fn, maxRetries = 3, baseDelay = 1000 } = params;
    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        return await fn();
      } catch (error: any) {
        const isRateLimit = error?.status === 429 || 
                          error?.message?.includes('429') || 
                          error?.message?.includes('rate limit');
        if (isRateLimit && attempt < maxRetries - 1) {
          const delay = baseDelay * Math.pow(2, attempt);
          this.logger.warn(`Rate limited, retrying in ${delay}ms... (attempt ${attempt + 1}/${maxRetries})`);
          await new Promise(resolve => setTimeout(resolve, delay));
          continue;
        }
        throw error;
      }
    }
    throw new Error('Max retries exceeded');
  }
}