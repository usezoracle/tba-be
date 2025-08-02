import {
  Controller,
  Get,
  Post,
  HttpStatus,
  HttpException,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiNotFoundResponse,
  ApiInternalServerErrorResponse,
} from '@nestjs/swagger';
import { ThrottlerGuard } from '@nestjs/throttler';
import { TokensService } from './tokens.service';
import { 
  TokensResponseDto, 
  ScanResponseDto
} from '../../shared/dto/response.dto';

/**
 * 🎯 TOKENS CONTROLLER - API ENDPOINTS
 * 
 * RESTful API controller that provides access to token data and scanning functionality.
 * This is the main interface for external clients to interact with the token discovery system.
 * 
 * 🛣️ AVAILABLE ENDPOINTS:
 * - GET /tokens - All tokens (Zora + TBA combined)
 * - GET /tokens/zora - Zora ecosystem tokens only
 * - GET /tokens/tba - Token Bound Account tokens only
 * - GET /tokens/metadata - Cache statistics and metadata
 * - POST /tokens/scan - Trigger manual blockchain scan
 * - GET /tokens/debug - System health and debug information
 * 
 * 🛡️ SECURITY FEATURES:
 * - Rate limiting via ThrottlerGuard (100 requests/minute)
 * - Input validation and sanitization
 * - Standardized error responses
 * - Comprehensive API documentation
 * 
 * 📊 RESPONSE FORMAT:
 * All endpoints return standardized responses via global interceptor:
 * - Success: { status: 'success', data: {...}, timestamp: '...' }
 * - Error: { status: 'error', error: { message: '...', errorType: '...' } }
 * 
 * 🎨 DESIGN PATTERNS:
 * - RESTful resource-based routing
 * - Dependency injection for service layer
 * - Comprehensive OpenAPI documentation
 * - Consistent error handling
 */
@ApiTags('tokens')
@Controller('tokens')
@UseGuards(ThrottlerGuard) // 🛡️ Rate limiting protection
export class TokensController {
  constructor(
    // 🪙 Inject tokens service for business logic
    private readonly tokensService: TokensService
  ) {}

  /**
   * 🌟 GET ALL TOKENS ENDPOINT
   * 
   * Primary endpoint that returns all discovered tokens regardless of type.
   * Combines both Zora and TBA tokens in a single response.
   * 
   * 📊 RESPONSE INCLUDES:
   * - Complete token metadata array
   * - Total count of tokens
   * - Type indicator ('ALL')
   * - Cache metadata and statistics
   * 
   * 🎯 USE CASES:
   * - Dashboard overviews
   * - Complete token listings
   * - Data exports and analysis
   * 
   * @returns TokensResponse with all tokens or 404 if none found
   */
  @Get()
  @ApiOperation({ 
    summary: 'Get all tokens (Zora + TBA combined)',
    description: 'Retrieves all available tokens from both Zora and TBA categories'
  })
  @ApiResponse({
    status: 200,
    description: 'Successfully retrieved all tokens',
    type: TokensResponseDto,
    schema: {
      example: {
        status: 'success',
        data: {
          tokens: [
            {
              id: '0x123...',
              name: 'Example Token',
              symbol: 'EXT',
              decimals: 18,
              address: '0xabc...',
              tick: 12345,
              sqrtPriceX96: '123456789...',
              price: '0.001234',
              coinType: 'ZORA_CREATOR_COIN',
              appType: 'TBA',
              blockNumber: '32965000',
              timestamp: 1704067200,
              timestampISO: '2024-01-01T00:00:00.000Z'
            }
          ],
          count: 1,
          type: 'ALL'
        },
        timestamp: '2025-07-30T01:23:45.678Z'
      }
    }
  })
  @ApiResponse({
    status: 404,
    description: 'No tokens found',
    schema: {
      example: {
        status: 'error',
        error: {
          message: 'No tokens found',
          errorType: 'NotFoundException'
        }
      }
    }
  })
  async getAllTokens() {
    const result = await this.tokensService.getAllTokens();
    if (!result) {
      throw new HttpException('No tokens found', HttpStatus.NOT_FOUND);
    }
    return result;
  }

  /**
   * 🎨 GET ZORA TOKENS ONLY
   * 
   * Filtered endpoint that returns only tokens from the Zora ecosystem.
   * Useful for applications focused specifically on Zora's creator economy.
   * 
   * 🏷️ ZORA TOKEN CHARACTERISTICS:
   * - Associated with Zora creator coins
   * - Used in Zora's NFT marketplace
   * - Creator economy focused
   * 
   * @returns TokensResponse with Zora tokens only
   */
  @Get('zora')
  @ApiOperation({ 
    summary: 'Get Zora tokens only',
    description: 'Retrieves only tokens from the Zora ecosystem'
  })
  @ApiResponse({
    status: 200,
    description: 'Successfully retrieved Zora tokens',
    type: TokensResponseDto,
  })
  @ApiNotFoundResponse({ 
    description: 'No Zora tokens found'
  })
  async getZoraTokens() {
    const result = await this.tokensService.getZoraTokens();
    if (!result) {
      throw new HttpException('No Zora tokens found', HttpStatus.NOT_FOUND);
    }
    return result;
  }

  /**
   * 🔗 GET TBA TOKENS ONLY
   * 
   * Filtered endpoint that returns only Token Bound Account (TBA) tokens.
   * TBAs enable NFTs to own assets and interact with DeFi protocols.
   * 
   * 🏷️ TBA TOKEN CHARACTERISTICS:
   * - Associated with Token Bound Accounts
   * - Enable NFT-owned DeFi positions
   * - Paired with base currencies (USDC, WETH)
   * 
   * @returns TokensResponse with TBA tokens only
   */
  @Get('tba')
  @ApiOperation({ 
    summary: 'Get TBA tokens only',
    description: 'Retrieves only Token Bound Account (TBA) tokens'
  })
  @ApiResponse({
    status: 200,
    description: 'Successfully retrieved TBA tokens',
    type: TokensResponseDto,
  })
  @ApiNotFoundResponse({ 
    description: 'No TBA tokens found'
  })
  async getTbaTokens() {
    const result = await this.tokensService.getTbaTokens();
    if (!result) {
      throw new HttpException('No TBA tokens found', HttpStatus.NOT_FOUND);
    }
    return result;
  }

  /**
   * 📊 GET TOKENS METADATA AND STATISTICS
   * 
   * Informational endpoint that provides cache statistics and metadata.
   * Useful for monitoring data freshness and system performance.
   * 
   * 📈 METADATA INCLUDES:
   * - Last update timestamps
   * - Token counts by category
   * - Cache health indicators
   * - Data freshness metrics
   * 
   * 💡 USE CASES:
   * - Monitoring dashboards
   * - Cache health checks
   * - Data freshness verification
   * - Performance analytics
   * 
   * @returns Metadata object with cache statistics
   */
  @Get('metadata')
  @ApiOperation({ 
    summary: 'Get tokens metadata and statistics',
    description: 'Retrieves statistical information about stored tokens'
  })
  @ApiResponse({
    status: 200,
    description: 'Successfully retrieved tokens metadata',
    schema: {
      example: {
        status: 'success',
        data: {
          zora: {
            lastUpdated: '2025-07-30T01:23:45.678Z',
            totalTokens: 25,
            creatorCoins: 15,
            v4Coins: 10,
            type: 'ZORA'
          },
          tba: {
            lastUpdated: '2025-07-30T01:23:45.678Z',
            totalTokens: 22,
            creatorCoins: 12,
            v4Coins: 10,
            type: 'TBA'
          },
          combined: {
            lastUpdated: '2025-07-30T01:23:45.678Z',
            totalTokens: 47,
            zoraTokens: 25,
            tbaTokens: 22
          }
        },
        timestamp: '2025-07-30T01:23:45.678Z'
      }
    }
  })
  async getTokensMetadata() {
    const result = await this.tokensService.getTokensMetadata();
    return result || { message: 'No metadata available' };
  }

  /**
   * 🔄 TRIGGER MANUAL SCAN
   * 
   * Administrative endpoint that initiates an immediate blockchain scan.
   * Bypasses the scheduled scanner for testing or urgent updates.
   * 
   * ⚡ SCAN PROCESS:
   * 1. Triggers TokenScannerService immediately
   * 2. Scans blockchain for new pools
   * 3. Processes and caches results
   * 4. Returns detailed scan statistics
   * 
   * ⚠️ USAGE NOTES:
   * - Resource intensive operation
   * - Should be used sparingly
   * - Useful for testing and debugging
   * 
   * @returns ScanResponse with detailed scan statistics
   */
  @Post('scan')
  @ApiOperation({ 
    summary: 'Trigger manual token scan',
    description: 'Manually triggers a blockchain scan for new tokens'
  })
  @ApiResponse({
    status: 200,
    description: 'Scan completed successfully',
    type: ScanResponseDto,
    schema: {
      example: {
        status: 'success',
        data: {
          message: 'Scan completed successfully',
          result: {
            tokensFound: 5,
            zoraTokens: 3,
            tbaTokens: 2,
            scanDuration: 1500,
            timestamp: '2025-07-30T01:23:45.678Z'
          }
        },
        timestamp: '2025-07-30T01:23:45.678Z'
      }
    }
  })
  @ApiInternalServerErrorResponse({ 
    description: 'Scan failed'
  })
  async triggerScan() {
    const result = await this.tokensService.triggerManualScan();
    return {
      message: 'Scan completed successfully',
      result,
    };
  }

  /**
   * 🔧 GET DEBUG INFORMATION
   * 
   * Diagnostic endpoint that provides comprehensive system health information.
   * Essential for monitoring, troubleshooting, and system maintenance.
   * 
   * 🔍 DEBUG DATA INCLUDES:
   * - Redis connection status
   * - Token counts by category
   * - Data availability flags
   * - Cache metadata
   * - System timestamps
   * 
   * 💡 USE CASES:
   * - Health monitoring dashboards
   * - Troubleshooting cache issues
   * - System status verification
   * - Performance monitoring
   * 
   * @returns Debug information object
   */
  @Get('debug')
  @ApiOperation({ 
    summary: 'Get debug information about Redis status',
    description: 'Provides debugging information about the Redis cache status and token counts'
  })
  @ApiResponse({
    status: 200,
    description: 'Debug information retrieved successfully',
    schema: {
      example: {
        status: 'success',
        data: {
          redis_status: 'connected',
          zora_tokens_count: 25,
          tba_tokens_count: 22,
          zora_exists: true,
          tba_exists: true,
          timestamp: '2025-07-30T01:23:45.678Z'
        },
        timestamp: '2025-07-30T01:23:45.678Z'
      }
    }
  })
  async getDebugInfo() {
    return this.tokensService.getDebugInfo();
  }
}