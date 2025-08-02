import { Injectable, Inject, OnModuleInit, forwardRef } from '@nestjs/common';
import { ConfigType } from '@nestjs/config';
import { type PoolKey } from '@uniswap/v4-sdk';

import { BlockchainService } from './blockchain.service';
import { ScanResult } from '../../shared';
import blockchainConfig from '../../config/blockchain.config';

// Import specialized services for modular architecture
import { BlockTimestampService } from './services/block-timestamp.service';
import { PoolProcessorService } from './services/pool-processor.service';
import { RetryService } from './services/retry.service';
import { SchedulerService } from '../infrastructure/scheduler';
import { PinoLogger } from 'nestjs-pino';
import { TokenRepository } from '../tokens/repositories/token.repository';

/**
 * 🎯 TOKEN SCANNER SERVICE - MAIN ORCHESTRATOR
 * 
 * This is the heart of the token discovery system. It orchestrates the entire
 * process of finding, processing, and storing Zora and TBA tokens from Uniswap V4 pools.
 * 
 * 🔄 SCANNING WORKFLOW:
 * 1. 📡 Fetch pool initialization events from blockchain
 * 2. 🔍 Filter for Zora-related pools (by hook addresses)
 * 3. ⏰ Get block timestamps for metadata
 * 4. 🏭 Process pools to extract token information
 * 5. 💾 Store results in repository
 * 6. 📊 Return scan statistics
 * 
 * 🏗️ ARCHITECTURE PATTERN:
 * - Uses specialized services for each concern (SRP - Single Responsibility Principle)
 * - Implements retry logic for blockchain calls
 * - Runs on scheduled intervals (every 2 seconds)
 * - Prevents concurrent scans with locking mechanism
 * 
 * 🎨 DESIGN DECISIONS:
 * - Modular: Each step handled by specialized service
 * - Resilient: Retry logic for network failures
 * - Efficient: Batch processing and caching
 * - Observable: Comprehensive logging at each step
 * 
 * 📊 DATA FLOW:
 * Scheduler → TokenScanner → [BlockchainService, PoolProcessor, etc.] → TokenRepository → Redis → API
 */
@Injectable()
export class TokenScannerService implements OnModuleInit {
  // 🔒 Prevents concurrent scanning operations
  private isScanning = false;

  constructor(
    // 🔗 Core blockchain interaction service
    private readonly blockchainService: BlockchainService,
    
    // 🏬 Token repository for storing results
    @Inject(forwardRef(() => TokenRepository))
    private readonly tokenRepository: TokenRepository,
    
    // ⏰ Service for fetching block timestamps efficiently
    private readonly blockTimestampService: BlockTimestampService,
    
    // 🏭 Service for processing pool data into token metadata
    private readonly poolProcessorService: PoolProcessorService,
    
    // 🔄 Service for handling retries and network resilience
    private readonly retryService: RetryService,
    
    // ⏲️ Service for managing scheduled tasks
    private readonly schedulerService: SchedulerService,
    
    // 🔧 Configuration for blockchain settings
    @Inject(blockchainConfig.KEY)
    private readonly config: ConfigType<typeof blockchainConfig>,
    
    // 📝 Logger for tracking operations
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(TokenScannerService.name);
  }

  /**
   * 🚀 MODULE INITIALIZATION
   * 
   * Sets up the automated scanning schedule when the module starts.
   * This ensures continuous monitoring of new token pools.
   * 
   * ⏲️ SCHEDULING STRATEGY:
   * - Runs every 2 seconds for near real-time discovery
   * - Includes safety check to prevent overlapping scans
   * - Handles errors gracefully without stopping the scheduler
   */
  async onModuleInit() {
    this.schedulerService.addCronJob(
      'tokenScan', // Job identifier
      '*/2 * * * * *', // Cron expression: Every 2 seconds
      async () => {
        // 🔒 Safety check: Don't start if already scanning
        if (this.isScanning) {
          this.logger.debug('Scan already in progress, skipping...');
          return;
        }
        
        try {
          // 🎯 Execute the main scanning logic
          await this.scanTokens();
        } catch (error) {
          // 🚨 Log errors but don't crash the scheduler
          this.logger.error('Scheduled scan failed', error);
        }
      },
    );
  }

  /**
   * 🎯 MAIN SCANNING ORCHESTRATION METHOD
   * 
   * This is the core method that coordinates the entire token discovery process.
   * It follows a well-defined pipeline to ensure reliable and efficient scanning.
   * 
   * 🔄 SCANNING PIPELINE:
   * 1. 🔒 Set scanning lock to prevent concurrent operations
   * 2. 📏 Calculate block range for scanning
   * 3. 📡 Fetch pool initialization events from blockchain
   * 4. 🔄 Transform raw events into structured pool keys
   * 5. 🎯 Filter for Zora-specific pools only
   * 6. ⏰ Fetch block timestamps for metadata
   * 7. 🏭 Process pools to extract token information
   * 8. 💾 Store results in repository
   * 9. 📊 Generate and return scan statistics
   * 
   * @returns ScanResult with statistics about the scan operation
   */
  async scanTokens(): Promise<ScanResult> {
    // 🔒 Set scanning flag to prevent concurrent operations
    this.isScanning = true;
    const startTime = Date.now();

    try {
      this.logger.info('Starting token scan...');

      // 📏 STEP 1: Calculate the block range to scan
      const { startBlock, endBlock } = this.getBlockRange();
      
      // 📡 STEP 2: Fetch pool initialization events from blockchain
      const logs = await this.fetchPoolEvents(startBlock, endBlock);
      
      // 🔄 STEP 3: Transform raw event logs into structured pool keys
      const poolKeys = this.transformLogsToPoolKeys(logs);

      // 🎯 STEP 4: Filter for Zora-related pools only
      const zoraPoolKeys = this.filterZoraPools(poolKeys);
      this.logger.info(
        `Found ${zoraPoolKeys.length} Zora pools out of ${poolKeys.length} total pools`,
      );

      // 🚫 Early exit if no Zora pools found
      if (zoraPoolKeys.length === 0) {
        return this.createEmptyResult(startTime);
      }

      // ⏰ STEP 5: Get unique block numbers and fetch their timestamps
      const uniqueBlockNumbers = [
        ...new Set(zoraPoolKeys.map((key) => key.blockNumber)),
      ];
      const blockTimestampCache =
        await this.blockTimestampService.fetchBlockTimestamps(
          uniqueBlockNumbers,
        );

      // 🏭 STEP 6: Process pools in batches to extract token metadata
      const tokens = await this.poolProcessorService.processPoolsBatched({
        poolKeys: zoraPoolKeys,
        blockTimestampCache,
      });

      // 💾 STEP 7: Store processed tokens in repository
      await this.tokenRepository.storeTokens(tokens);
      
      // 📊 STEP 8: Generate scan result with statistics
      const result = this.createScanResult(tokens, startTime);

      this.logger.info(
        `Scan completed: ${result.tokensFound} tokens (${result.zoraTokens} Zora, ${result.tbaTokens} TBA) in ${result.scanDuration}ms`,
      );

      return result;
    } finally {
      // 🔓 Always release the scanning lock
      this.isScanning = false;
    }
  }

  // ==========================================
  // 🔧 PRIVATE HELPER METHODS
  // ==========================================

  /**
   * 📏 GET BLOCK RANGE FOR SCANNING
   * 
   * Calculates the block range to scan based on configuration.
   * Uses a sliding window approach to continuously scan new blocks.
   * 
   * 🎯 STRATEGY:
   * - Start from configured block number
   * - Scan a fixed range of blocks (e.g., 400 blocks)
   * - This creates a moving window that captures new pools
   * 
   * @returns Object with startBlock and endBlock
   */
  private getBlockRange() {
    const startBlock = this.config.startBlockNumber;
    const endBlock = startBlock + BigInt(this.config.blockRange);
    return { startBlock, endBlock };
  }

  /**
   * 📡 FETCH POOL INITIALIZATION EVENTS
   * 
   * Retrieves pool creation events from the Uniswap V4 PoolManager contract.
   * Uses retry logic to handle network failures gracefully.
   * 
   * 🔍 WHAT WE'RE LOOKING FOR:
   * - 'Initialize' events from PoolManager contract
   * - These events contain pool configuration data
   * - Each event represents a new trading pool
   * 
   * @param startBlock - Starting block number
   * @param endBlock - Ending block number
   * @returns Array of pool initialization events
   */
  private async fetchPoolEvents(startBlock: bigint, endBlock: bigint) {
    return this.retryService.retryWithBackoff({
      fn: () =>
        this.blockchainService.getContractEvents({
          fromBlock: startBlock,
          toBlock: endBlock,
        }),
    });
  }

  /**
   * 🔄 TRANSFORM EVENT LOGS TO POOL KEYS
   * 
   * Converts raw blockchain event logs into structured PoolKey objects.
   * This standardizes the data format for further processing.
   * 
   * 📊 DATA TRANSFORMATION:
   * - Raw event logs → Structured PoolKey objects
   * - Extracts: currencies, fee, tickSpacing, hooks, blockNumber
   * - Adds blockNumber for timestamp lookup
   * 
   * @param logs - Raw event logs from blockchain
   * @returns Array of structured pool keys with block numbers
   */
  private transformLogsToPoolKeys(
    logs: any[],
  ): (PoolKey & { blockNumber: bigint })[] {
    return logs.map((log) => ({
      currency0: log.args.currency0,        // First token in the pair
      currency1: log.args.currency1,        // Second token in the pair
      fee: log.args.fee,                    // Pool fee tier
      tickSpacing: log.args.tickSpacing,    // Price tick spacing
      hooks: log.args.hooks,                // Hook contract address (key for filtering)
      blockNumber: log.blockNumber,         // Block where pool was created
    })) as (PoolKey & { blockNumber: bigint })[];
  }

  /**
   * 🎯 FILTER FOR ZORA POOLS ONLY
   * 
   * Filters pool keys to only include those related to Zora ecosystem.
   * Uses hook addresses to identify Zora Creator Coins and Zora V4 Coins.
   * 
   * 🔍 FILTERING LOGIC:
   * - Check hook address against known Zora hook addresses
   * - zoraCreatorCoin: Original Zora creator coin pools
   * - zoraV4Coin: New Zora V4 coin pools
   * 
   * @param poolKeys - All pool keys from events
   * @returns Filtered array containing only Zora-related pools
   */
  private filterZoraPools(poolKeys: (PoolKey & { blockNumber: bigint })[]) {
    return poolKeys.filter(
      (key) =>
        key.hooks === this.config.hooks.zoraCreatorCoin ||
        key.hooks === this.config.hooks.zoraV4Coin,
    );
  }

  /**
   * 📊 CREATE EMPTY SCAN RESULT
   * 
   * Generates a scan result when no tokens are found.
   * Maintains consistent result structure for API responses.
   * 
   * @param startTime - Scan start timestamp
   * @returns Empty scan result with timing information
   */
  private createEmptyResult(startTime: number): ScanResult {
    return {
      blocksScanned: 0,
      startBlock: '0',
      endBlock: '0',
      poolsDiscovered: 0,
      tokensAdded: 0,
      tokensFound: 0,
      zoraTokens: 0, 
      tbaTokens: 0,
      scanDuration: Date.now() - startTime,
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * 📊 CREATE SCAN RESULT FROM PROCESSED TOKENS
   * 
   * Generates comprehensive scan statistics from processed token data.
   * Categorizes tokens by type (ZORA vs TBA) for detailed reporting.
   * 
   * 🏷️ TOKEN CATEGORIZATION:
   * - ZORA: Standard Zora ecosystem tokens
   * - TBA: Token Bound Account related tokens
   * 
   * @param tokens - Array of processed token metadata
   * @param startTime - Scan start timestamp
   * @returns Detailed scan result with statistics
   */
  private createScanResult(tokens: any[], startTime: number): ScanResult {
    const zoraTokens = tokens.filter((t) => t.appType === 'ZORA').length;
    const tbaTokens = tokens.filter((t) => t.appType === 'TBA').length;
    
    // Get block range info from the first and last tokens (if available)
    let startBlock = '0';
    let endBlock = '0';
    if (tokens.length > 0) {
      const blockNumbers = tokens.map(t => BigInt(t.blockNumber || 0)).sort();
      startBlock = blockNumbers[0].toString();
      endBlock = blockNumbers[blockNumbers.length - 1].toString();
    }
    
    return {
      blocksScanned: tokens.length > 0 ? tokens.length : 0,
      startBlock,
      endBlock,
      poolsDiscovered: tokens.length,
      tokensAdded: tokens.length,
      tokensFound: tokens.length,
      zoraTokens,
      tbaTokens,
      scanDuration: Date.now() - startTime,
      timestamp: new Date().toISOString(),
    };
  }
}