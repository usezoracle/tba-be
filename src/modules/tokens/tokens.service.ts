import { Injectable } from '@nestjs/common';
import { PinoLogger } from 'nestjs-pino';
import { TokenScannerService } from '../blockchain/token-scanner.service';
import { TokensResponseDto } from '../../shared/dto/response.dto';
import { ScanResult } from '../../shared/interfaces/token.interface';
import { TokenRepository } from './repositories/token.repository';

/**
 * 🪙 TOKENS SERVICE - API DATA LAYER
 * 
 * This service acts as the business logic layer between the API controllers
 * and the underlying data sources (Redis cache and blockchain scanner).
 * 
 * 🎯 MAIN RESPONSIBILITIES:
 * - Provide clean API for token data retrieval
 * - Handle data formatting and response structure
 * - Manage cache interactions through TokenRepository
 * - Trigger manual scans when requested
 * 
 * 📊 DATA SOURCES:
 * - Primary: Redis cache (fast, structured data)
 * - Secondary: TokenScannerService (for manual scans)
 * 
 * 🏗️ ARCHITECTURE PATTERN:
 * - Service Layer: Handles business logic
 * - Repository Layer: Handles data access through TokenRepository
 * - Error Handling: Graceful degradation with null returns
 * - Logging: Comprehensive operation tracking
 * 
 * 🔄 DATA FLOW:
 * API Controller → TokensService → TokenRepository → Cached Data
 *                              ↘ TokenScannerService → Fresh Scan
 */
@Injectable()
export class TokensService {
  constructor(
    // 💾 Token repository for cached token data access
    private readonly tokenRepository: TokenRepository,
    
    // 🔍 Scanner service for triggering manual scans
    private readonly tokenScannerService: TokenScannerService,
    
    // 📝 Logger for operation tracking
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(TokensService.name);
  }

  /**
   * 🌟 GET ALL TOKENS
   * 
   * Retrieves all cached tokens (both Zora and TBA) from repository.
   * This is the main endpoint for getting the complete token dataset.
   * 
   * 📊 RESPONSE STRUCTURE:
   * - tokens: Array of token metadata
   * - count: Total number of tokens
   * - type: 'ALL' (indicates mixed token types)
   * - metadata: Cache statistics and timestamps
   * 
   * 🔄 DATA FLOW:
   * 1. Fetch all tokens from repository
   * 2. Get metadata for cache statistics
   * 3. Format response with counts and metadata
   * 
   * @returns Formatted response with all tokens or null if none found
   */
  async getAllTokens(): Promise<any | null> {
    try {
      // 📥 Fetch all tokens from repository
      const tokens = await this.tokenRepository.getAllTokens();
      if (!tokens) return null;

      // 📊 Get cache metadata for response enrichment
      const metadata = await this.tokenRepository.getTokensMetadata();

      return {
        tokens,
        count: tokens.length,
        type: 'ALL', // Indicates mixed token types
        metadata: metadata?.combined
          ? {
            lastUpdated: metadata.combined.lastUpdated,
            totalTokens: metadata.combined.totalTokens,
            creatorCoins: metadata.combined.zoraTokens || 0,
            v4Coins: metadata.combined.tbaTokens || 0,
          }
          : undefined,
      };
    } catch (error) {
      this.logger.error('Failed to get all tokens', error);
      return null; // Graceful degradation
    }
  }

  /**
   * 🎨 GET ZORA TOKENS ONLY
   * 
   * Retrieves only Zora ecosystem tokens from the cache.
   * These are tokens associated with Zora's creator economy platform.
   * 
   * 🏷️ ZORA TOKEN CHARACTERISTICS:
   * - Associated with Zora creator coins
   * - Used in Zora's NFT and creator economy
   * - Filtered by specific hook addresses
   * 
   * @returns Formatted response with Zora tokens only or null if none found
   */
  async getZoraTokens(): Promise<any | null> {
    try {
      // 📥 Fetch only Zora tokens from repository
      const tokens = await this.tokenRepository.getZoraTokens();
      if (!tokens) return null;

      // 📊 Get metadata for response context
      const metadata = await this.tokenRepository.getTokensMetadata();

      return {
        tokens,
        count: tokens.length,
        type: 'ZORA', // Specific token type identifier
        metadata: metadata?.combined
          ? {
            lastUpdated: metadata.combined.lastUpdated,
            totalTokens: metadata.combined.totalTokens,
            creatorCoins: metadata.combined.zoraTokens || 0,
            v4Coins: metadata.combined.tbaTokens || 0,
          }
          : undefined,
      };
    } catch (error) {
      this.logger.error('Failed to get Zora tokens', error);
      return null; // Graceful degradation
    }
  }

  /**
   * 🔗 GET TBA TOKENS ONLY
   * 
   * Retrieves only Token Bound Account (TBA) related tokens from the cache.
   * TBAs are smart contract wallets owned by NFTs, enabling new DeFi primitives.
   * 
   * 🏷️ TBA TOKEN CHARACTERISTICS:
   * - Associated with Token Bound Accounts
   * - Paired with specific base currencies (USDC, WETH)
   * - Enable NFT-owned DeFi positions
   * 
   * @returns Formatted response with TBA tokens only or null if none found
   */
  async getTbaTokens(): Promise<any | null> {
    try {
      // 📥 Fetch only TBA tokens from repository
      const tokens = await this.tokenRepository.getTbaTokens();
      if (!tokens) return null;

      // 📊 Get metadata for response context
      const metadata = await this.tokenRepository.getTokensMetadata();

      return {
        tokens,
        count: tokens.length,
        type: 'TBA', // Specific token type identifier
        metadata: metadata?.combined
          ? {
            lastUpdated: metadata.combined.lastUpdated,
            totalTokens: metadata.combined.totalTokens,
            creatorCoins: metadata.combined.zoraTokens || 0,
            v4Coins: metadata.combined.tbaTokens || 0,
          }
          : undefined,
      };
    } catch (error) {
      this.logger.error('Failed to get TBA tokens', error);
      return null; // Graceful degradation
    }
  }

  /**
   * 🔄 TRIGGER MANUAL SCAN
   * 
   * Initiates an immediate token scan bypassing the scheduled scanner.
   * Useful for testing, debugging, or when fresh data is urgently needed.
   * 
   * ⚡ SCAN PROCESS:
   * 1. Triggers TokenScannerService.scanTokens()
   * 2. Scans blockchain for new pools
   * 3. Processes and caches results
   * 4. Returns scan statistics
   * 
   * ⚠️ NOTE: This can be resource-intensive, use sparingly
   * 
   * @returns ScanResult with scan statistics
   * @throws Error if scan fails (handled by controller)
   */
  async triggerManualScan(): Promise<ScanResult> {
    try {
      this.logger.info('Manual scan triggered');
      return await this.tokenScannerService.scanTokens();
    } catch (error) {
      this.logger.error('Manual scan failed', error);
      throw error; // Let the controller handle the error formatting
    }
  }
}