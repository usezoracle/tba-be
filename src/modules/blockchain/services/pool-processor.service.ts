import { Injectable, Inject } from '@nestjs/common';
import { ConfigType } from '@nestjs/config';
import { Pool, type PoolKey } from '@uniswap/v4-sdk';
import { type Currency } from '@uniswap/sdk-core';
import { TokenMetadata } from '../../../shared';
import blockchainConfig from '../../../config/blockchain.config';
import { BlockchainService } from '../blockchain.service';
import { CurrencyService } from './currency.service';
import { RetryService } from './retry.service';
import { ProcessPoolsBatchedParams } from '../interfaces/process-pools-batched.params.interface';
import { ProcessPoolParams } from '../interfaces/process-pool.params.interface';
import { PinoLogger } from 'nestjs-pino';
import { batching } from '../../../shared/utils';

/**
 * 🏭 POOL PROCESSOR SERVICE - TOKEN METADATA EXTRACTION
 * 
 * This service is the heavy lifter of the token discovery system. It takes raw
 * pool data and transforms it into rich, structured token metadata.
 * 
 * 🎯 MAIN RESPONSIBILITIES:
 * - Process Uniswap V4 pools to extract token information
 * - Fetch on-chain data (prices, liquidity, token details)
 * - Classify tokens by type (ZORA vs TBA, Creator vs V4)
 * - Handle batch processing for efficiency
 * - Implement rate limiting and retry logic
 * 
 * 🏗️ PROCESSING PIPELINE:
 * 1. 📥 Receive pool keys from scanner
 * 2. 🔄 Process in batches to avoid rate limits
 * 3. 🌐 Fetch pool state from blockchain
 * 4. 💰 Calculate token prices and metadata
 * 5. 🏷️ Classify tokens by type and ecosystem
 * 6. 📊 Return structured token metadata
 * 
 * ⚡ PERFORMANCE OPTIMIZATIONS:
 * - Batch processing (3 pools at a time)
 * - Rate limiting delays (300ms between batches)
 * - Retry logic for network failures
 * - Parallel currency fetching
 * 
 * 🎨 DESIGN PATTERNS:
 * - Single Responsibility: Only handles pool processing
 * - Dependency Injection: Uses specialized services
 * - Error Handling: Graceful degradation on failures
 * - Configurable: Uses external configuration
 */
@Injectable()
export class PoolProcessorService {
  // ⚡ Performance tuning constants
  private static readonly BATCH_SIZE = 3;    // Pools processed simultaneously
  private static readonly BATCH_DELAY = 300; // Milliseconds between batches

  constructor(
    // 🔗 Core blockchain interaction service
    private readonly blockchainService: BlockchainService,

    // 🪙 Service for fetching token/currency information
    private readonly currencyService: CurrencyService,

    // 🔄 Service for handling retries and network resilience
    private readonly retryService: RetryService,

    // 🔧 Configuration for addresses and settings
    @Inject(blockchainConfig.KEY)
    private readonly config: ConfigType<typeof blockchainConfig>,

    // 📝 Logger for operation tracking
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(PoolProcessorService.name);
  }

  /**
   * 🏭 PROCESS MULTIPLE POOLS IN BATCHES
   * 
   * Main entry point for processing pool data. Implements batching strategy
   * to balance performance with rate limiting requirements.
   * 
   * 🔄 BATCHING STRATEGY:
   * - Process 3 pools simultaneously (BATCH_SIZE)
   * - 300ms delay between batches (BATCH_DELAY)
   * - Parallel processing within each batch
   * - Graceful handling of individual failures
   * 
   * 📊 PROCESSING FLOW:
   * 1. Split pool keys into batches
   * 2. Process each batch in parallel
   * 3. Collect successful results
   * 4. Apply rate limiting delays
   * 5. Return aggregated token metadata
   * 
   * @param params - Contains pool keys and block timestamp cache
   * @returns Array of processed token metadata
   */
  async processPoolsBatched(params: ProcessPoolsBatchedParams): Promise<TokenMetadata[]> {
    const { poolKeys, blockTimestampCache } = params;
    const tokens = await batching(
      poolKeys,
      (key) => this.processPool({ key, blockTimestampCache }).then(res => res ? res : null),
      PoolProcessorService.BATCH_SIZE,
      PoolProcessorService.BATCH_DELAY
    );
    return tokens;
  }

  /**
   * 🔧 PROCESS SINGLE POOL TO EXTRACT TOKEN METADATA
   * 
   * Core method that transforms a pool key into rich token metadata.
   * This is where the magic happens - raw blockchain data becomes structured information.
   * 
   * 📊 PROCESSING STEPS:
   * 1. 🌐 Load pool data from blockchain (with retry logic)
   * 2. 💰 Calculate token prices from pool ratios
   * 3. 🏷️ Classify token by coin type and app type
   * 4. 🪙 Identify the actual token vs base currency
   * 5. ⏰ Add timestamp information
   * 6. 📦 Package into TokenMetadata structure
   * 
   * @param params - Contains pool key and block timestamp cache
   * @returns TokenMetadata object or null if processing fails
   */
  private async processPool(params: ProcessPoolParams): Promise<TokenMetadata | null> {
    const { key, blockTimestampCache } = params;

    try {
      // 🌐 Load pool data with retry logic for network resilience
      const pool = await this.retryService.retryWithBackoff({
        fn: () => this.loadPoolData(key)
      });

      // 💰 Extract price information from pool
      const currency0Price = pool.currency0Price.toSignificant(6);
      const currency1Price = pool.currency1Price.toSignificant(6);

      // 🏷️ Classify the token by various dimensions
      const coinType = this.determineCoinType(key.hooks);
      const appType = this.determineAppType(pool);

      // 🪙 Identify which currency is the token and get its price
      const { tokenCurrency, price } = this.getTokenCurrencyAndPrice(
        pool,
        currency0Price,
        currency1Price
      );

      // ⏰ Get block timestamp for when this pool was created
      const blockTimestamp = blockTimestampCache.get(key.blockNumber)!;

      // 📦 Package all information into structured metadata
      return {
        id: pool.poolId,
        name: tokenCurrency.name || 'Unknown',
        symbol: tokenCurrency.symbol || 'UNKNOWN',
        decimals: tokenCurrency.decimals,
        address: tokenCurrency.wrapped.address,
        tick: pool.tickCurrent,
        sqrtPriceX96: pool.sqrtRatioX96.toString(),
        price,
        coinType,
        appType,
        blockNumber: key.blockNumber.toString(),
        timestamp: Number(blockTimestamp),
        timestampISO: new Date(Number(blockTimestamp) * 1000).toISOString(),
      };
    } catch (error) {
      this.logger.error(`Error processing pool ${key.hooks}:`, error);
      return null; // Graceful degradation - don't fail entire batch
    }
  }

  /**
   * 🌐 LOAD POOL DATA FROM BLOCKCHAIN
   * 
   * Fetches all necessary on-chain data to construct a Uniswap Pool instance.
   * This involves multiple blockchain calls that are optimized for efficiency.
   * 
   * 📡 DATA FETCHING STRATEGY:
   * 1. 🪙 Fetch currency metadata in parallel (name, symbol, decimals)
   * 2. 🆔 Generate pool ID from pool parameters
   * 3. 📊 Fetch pool state (price, tick, liquidity)
   * 4. 🏗️ Construct Pool instance with all data
   * 
   * @param key - Pool key containing currencies, fee, etc.
   * @returns Constructed Uniswap Pool instance
   */
  private async loadPoolData(key: PoolKey) {
    const publicClient = this.blockchainService.getPublicClient();
    const stateView = this.blockchainService.getStateView();

    // 🪙 Fetch metadata for both currencies in parallel for efficiency
    const [currency0, currency1] = await Promise.all([
      this.currencyService.getCurrency({ address: key.currency0, publicClient }),
      this.currencyService.getCurrency({ address: key.currency1, publicClient }),
    ]);

    // 🆔 Generate unique pool identifier
    const poolId = Pool.getPoolId(
      currency0,
      currency1,
      key.fee,
      key.tickSpacing,
      key.hooks,
    ) as `0x${string}`;

    // 📊 Fetch current pool state from StateView contract
    const [sqrtPriceX96, tick] = await stateView.read.getSlot0([poolId]);
    const liquidity = await stateView.read.getLiquidity([poolId]);

    // 🏗️ Construct Pool instance with all fetched data
    return new Pool(
      currency0,
      currency1,
      key.fee,
      key.tickSpacing,
      key.hooks,
      sqrtPriceX96.toString(),
      liquidity.toString(),
      tick,
    );
  }

  // ==========================================
  // 🏷️ TOKEN CLASSIFICATION METHODS
  // ==========================================

  /**
   * 🎯 DETERMINE COIN TYPE BY HOOK ADDRESS
   * 
   * Classifies tokens based on their associated hook contract.
   * Hook addresses are unique identifiers for different token ecosystems.
   * 
   * 🔍 CLASSIFICATION LOGIC:
   * - zoraCreatorCoin hook → ZORA_CREATOR_COIN (original creator coins)
   * - zoraV4Coin hook → ZORA_V4_COIN (new V4 ecosystem coins)
   * 
   * @param hooks - Hook contract address from pool
   * @returns Token coin type classification
   */
  private determineCoinType(hooks: string): 'ZORA_CREATOR_COIN' | 'ZORA_V4_COIN' {
    if (hooks === this.config.hooks.zoraCreatorCoin) {
      return 'ZORA_CREATOR_COIN';
    }
    return 'ZORA_V4_COIN';
  }

  /**
   * 🏷️ DETERMINE APP TYPE BY TOKEN PAIRINGS
   * 
   * Classifies tokens as either ZORA or TBA based on their trading pairs.
   * TBA tokens are paired with specific base currencies (USDC, WETH).
   * 
   * 🔍 CLASSIFICATION LOGIC:
   * - If paired with TBA base currencies → TBA
   * - Otherwise → ZORA
   * 
   * 💡 TBA (Token Bound Account) tokens enable NFT-owned DeFi positions
   * 
   * @param pool - Uniswap pool instance
   * @returns App type classification
   */
  private determineAppType(pool: Pool): 'ZORA' | 'TBA' {
    const currency0Address = pool.currency0.wrapped.address;
    const currency1Address = pool.currency1.wrapped.address;

    // Check if either currency is in the TBA pairings list
    const isTBA =
      this.config.tbaPairings.includes(currency0Address) ||
      this.config.tbaPairings.includes(currency1Address);

    return isTBA ? 'TBA' : 'ZORA';
  }

  /**
   * 💰 GET TOKEN CURRENCY AND PRICE
   * 
   * Identifies which currency in the pair is the actual token (not base currency)
   * and returns its current price.
   * 
   * 🔍 LOGIC:
   * - If currency0 is a TBA pairing → token is currency1
   * - Otherwise → token is currency0
   * 
   * @param pool - Uniswap pool instance
   * @param currency0Price - Price of currency0
   * @param currency1Price - Price of currency1
   * @returns Object with token currency and its price
   */
  private getTokenCurrencyAndPrice(
    pool: Pool,
    currency0Price: string,
    currency1Price: string
  ): { tokenCurrency: Currency; price: string } {
    const currency0Address = pool.currency0.wrapped.address;

    // If currency0 is a base pairing, the token is currency1
    if (this.config.tbaPairings.includes(currency0Address)) {
      return {
        tokenCurrency: pool.currency1,
        price: currency1Price,
      };
    }

    // Otherwise, the token is currency0
    return {
      tokenCurrency: pool.currency0,
      price: currency0Price,
    };
  }
}