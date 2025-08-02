import { Module, forwardRef } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { BlockchainService } from './blockchain.service';
import { TokenScannerService } from './token-scanner.service';
import blockchainConfig from '../../config/blockchain.config';
import { RedisModule } from '../infrastructure/redis';
import { SchedulerModule } from '../infrastructure/scheduler';
import { EventBusModule } from '../infrastructure/events/event-bus.module';
import { TokensModule } from '../tokens/tokens.module';

// Import specialized services for modular architecture
import { BlockTimestampService } from './services/block-timestamp.service';
import { PoolProcessorService } from './services/pool-processor.service';
import { CurrencyService } from './services/currency.service';
import { RetryService } from './services/retry.service';

/**
 * 🔗 BLOCKCHAIN MODULE - CORE BLOCKCHAIN FUNCTIONALITY
 * 
 * This module encapsulates all blockchain-related functionality for the token discovery system.
 * It provides a clean interface for interacting with Uniswap V4 pools on Base network.
 * 
 * 🏗️ MODULE ARCHITECTURE:
 * - Core Services: BlockchainService, TokenScannerService
 * - Specialized Services: Pool processing, timestamps, currency info, retries
 * - External Dependencies: Redis for caching, Scheduler for automation, TokensModule for repository
 * - Configuration: Blockchain-specific settings and contract addresses
 * 
 * 🎯 MAIN RESPONSIBILITIES:
 * - Blockchain interaction and data fetching
 * - Token discovery and metadata extraction
 * - Automated scanning with scheduling
 * - Data processing and caching
 * 
 * 🔄 DATA FLOW:
 * Scheduler → TokenScanner → BlockchainService → Uniswap V4 → PoolProcessor → TokenRepository → Redis
 * 
 * 📦 EXPORTS:
 * - All services are exported for potential reuse in other modules
 * - Enables composition and testing
 * - Supports modular architecture principles
 */
@Module({
  imports: [
    // 🔧 Configuration for blockchain settings
    ConfigModule.forFeature(blockchainConfig),
    
    // 💾 Redis for caching processed data
    RedisModule,
    
    // ⏲️ Scheduler for automated scanning
    SchedulerModule,
    
    // 📢 Event bus for communication
    EventBusModule,
    
    // 🏬 Tokens module for repository (with forward ref to avoid circular dependency)
    forwardRef(() => TokensModule),
  ],
  providers: [
    // 🌟 Core blockchain services
    BlockchainService,      // Low-level blockchain interactions
    TokenScannerService,    // High-level scanning orchestration
    
    // 🔧 Specialized utility services
    BlockTimestampService,  // Efficient timestamp fetching
    PoolProcessorService,   // Pool data processing
    CurrencyService,        // Token metadata fetching
    RetryService,           // Network resilience
  ],
  exports: [
    // 🌟 Export core services for other modules
    BlockchainService,
    TokenScannerService,
    
    // 🔧 Export specialized services for potential reuse
    BlockTimestampService,
    PoolProcessorService,
    CurrencyService,
    RetryService,
  ],
})
export class BlockchainModule {}