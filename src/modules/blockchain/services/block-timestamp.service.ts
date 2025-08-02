import { Injectable } from '@nestjs/common';
import { BlockchainService } from '../blockchain.service';
import { RetryService } from './retry.service';

/**
 * ⏰ BLOCK TIMESTAMP SERVICE - EFFICIENT TIMESTAMP FETCHER
 * 
 * Specialized service for fetching block timestamps in an optimized, batched manner.
 * Essential for adding temporal metadata to token information.
 * 
 * 🎯 MAIN RESPONSIBILITIES:
 * - Fetch block timestamps for multiple blocks efficiently
 * - Implement batching to optimize RPC usage
 * - Cache results to avoid duplicate requests
 * - Handle rate limiting with delays
 * 
 * ⚡ PERFORMANCE OPTIMIZATIONS:
 * - Batch processing (10 blocks at a time)
 * - Parallel fetching within batches
 * - Rate limiting delays (200ms between batches)
 * - In-memory caching with Map structure
 * 
 * 🔄 BATCHING STRATEGY:
 * - Process 10 blocks simultaneously
 * - 200ms delay between batches
 * - Retry logic for network failures
 * - Return cached Map for O(1) lookups
 * 
 * 💡 USE CASES:
 * - Adding creation timestamps to token metadata
 * - Temporal analysis of token launches
 * - Historical data enrichment
 */
@Injectable()
export class BlockTimestampService {
  // ⚡ Performance tuning constants
  private static readonly BATCH_SIZE = 10;   // Blocks processed simultaneously
  private static readonly BATCH_DELAY = 200; // Milliseconds between batches

  constructor(
    // 🔗 Core blockchain service for fetching block data
    private readonly blockchainService: BlockchainService,
    
    // 🔄 Retry service for network resilience
    private readonly retryService: RetryService,
  ) {}

  /**
   * ⏰ FETCH BLOCK TIMESTAMPS IN OPTIMIZED BATCHES
   * 
   * Efficiently fetches timestamps for multiple blocks using a batching strategy.
   * Returns a Map for O(1) timestamp lookups during token processing.
   * 
   * 🔄 BATCHING WORKFLOW:
   * 1. 📦 Split block numbers into batches of 10
   * 2. 🚀 Process each batch in parallel
   * 3. 💾 Cache results in Map structure
   * 4. ⏱️ Apply rate limiting delays
   * 5. 📊 Return complete timestamp cache
   * 
   * ⚡ EFFICIENCY BENEFITS:
   * - Reduces RPC calls by batching
   * - Parallel processing within batches
   * - O(1) lookup performance
   * - Network-friendly rate limiting
   * 
   * @param blockNumbers - Array of block numbers to fetch timestamps for
   * @returns Map with block number → timestamp mapping
   */
  async fetchBlockTimestamps(blockNumbers: bigint[]): Promise<Map<bigint, bigint>> {
    const cache = new Map<bigint, bigint>();

    // 🔄 Process blocks in batches for optimal performance
    for (let i = 0; i < blockNumbers.length; i += BlockTimestampService.BATCH_SIZE) {
      const batch = blockNumbers.slice(i, i + BlockTimestampService.BATCH_SIZE);
      
      // 🚀 Create parallel promises for batch processing
      const promises = batch.map((blockNumber) =>
        this.retryService.retryWithBackoff({
          fn: () => this.blockchainService.getBlock(blockNumber),
        }),
      );

      // ⏳ Wait for all blocks in batch to complete
      const blocks = await Promise.all(promises);
      
      // 💾 Cache the timestamp results
      blocks.forEach((block, index) => {
        cache.set(batch[index], block.timestamp);
      });

      // ⏱️ Rate limiting: Small delay between batches
      if (i + BlockTimestampService.BATCH_SIZE < blockNumbers.length) {
        await new Promise((resolve) => 
          setTimeout(resolve, BlockTimestampService.BATCH_DELAY)
        );
      }
    }

    return cache;
  }
}