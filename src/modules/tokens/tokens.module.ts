import { Module, forwardRef } from '@nestjs/common';
import { TokensController } from './tokens.controller';
import { TokensService } from './tokens.service';
import { RedisModule } from '../infrastructure/redis';
import { BlockchainModule } from '../blockchain/blockchain.module';
import { TokenRepository } from './repositories/token.repository';

/**
 * 🪙 TOKENS MODULE - API LAYER FOR TOKEN DATA
 * 
 * This module provides the API layer for accessing discovered token data.
 * It acts as the interface between external clients and the token discovery system.
 * 
 * 🎯 MODULE RESPONSIBILITIES:
 * - RESTful API endpoints for token data
 * - Business logic for data formatting
 * - Integration with caching and scanning systems
 * - Rate limiting and security
 * 
 * 🛣️ API ENDPOINTS PROVIDED:
 * - GET /tokens - All tokens
 * - GET /tokens/zora - Zora tokens only
 * - GET /tokens/tba - TBA tokens only
 * - GET /tokens/metadata - Cache statistics
 * - POST /tokens/scan - Manual scan trigger
 * - GET /tokens/debug - System diagnostics
 * 
 * 🏗️ ARCHITECTURE:
 * - Controller: HTTP request handling and validation
 * - Service: Business logic
 * - Repository: Data access
 * - Dependencies: Redis for data, Blockchain for scanning
 * 
 * 🔄 DATA FLOW:
 * HTTP Request → Controller → Service → Repository → Redis → Response
 *                        └→ TokenScannerService → Blockchain
 */
@Module({
  imports: [
    // 💾 Redis module for cached token data access
    RedisModule,
    
    // 🔗 Blockchain module for scanning functionality (with forward ref to avoid circular dependency)
    forwardRef(() => BlockchainModule),
  ],
  controllers: [
    // 🛣️ REST API controller for token endpoints
    TokensController,
  ],
  providers: [
    // 🏢 Business logic service
    TokensService,
    
    // 📦 Repository for data access
    TokenRepository,
  ],
  exports: [
    // 📤 Export service for potential use in other modules
    TokensService,
    
    // 📤 Export repository for potential use in other modules
    TokenRepository,
  ],
})
export class TokensModule {}