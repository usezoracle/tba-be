import { Injectable, Inject } from '@nestjs/common';
import { PinoLogger } from 'nestjs-pino';
import { ConfigType } from '@nestjs/config';
import { TokenMetadata } from '../../../shared';
import { RedisService } from '../../../modules/infrastructure/redis/redis.service';
import redisConfig from '../../../config/redis.config';

interface TokensData {
  tokens: TokenMetadata[];
  metadata: {
    lastUpdated: string;
    totalTokens: number;
    creatorCoins: number;
    v4Coins: number;
    type: string;
  };
}

@Injectable()
export class TokenRepository {
  constructor(
    private readonly redisService: RedisService,
    private readonly logger: PinoLogger,
    @Inject(redisConfig.KEY)
    private readonly config: ConfigType<typeof redisConfig>,
  ) {
    this.logger.setContext(TokenRepository.name);
  }

  /**
   * Store tokens with their metadata
   * @param tokens Array of token metadata
   */
  async storeTokens(tokens: TokenMetadata[]): Promise<void> {
    try {
      // Separate tokens by appType
      const zoraTokens = tokens.filter((t) => t.appType === 'ZORA');
      const tbaTokens = tokens.filter((t) => t.appType === 'TBA');

      this.logger.debug(`Storing ${zoraTokens.length} Zora tokens and ${tbaTokens.length} TBA tokens`);

      // Get existing tokens to merge without duplicates
      const [existingZoraData, existingTbaData] = await Promise.all([
        this.redisService.get<TokensData>(this.config.keys.zoraTokens),
        this.redisService.get<TokensData>(this.config.keys.tbaTokens),
      ]);

      // Merge tokens, avoiding duplicates by address
      const finalZoraTokens = this.mergeTokens(existingZoraData?.tokens || [], zoraTokens);
      const finalTbaTokens = this.mergeTokens(existingTbaData?.tokens || [], tbaTokens);

      const timestamp = new Date().toISOString();

      // Prepare data structures
      const zoraData: TokensData = {
        tokens: finalZoraTokens,
        metadata: {
          lastUpdated: timestamp,
          totalTokens: finalZoraTokens.length,
          creatorCoins: finalZoraTokens.filter((t) => t.coinType === 'ZORA_CREATOR_COIN').length,
          v4Coins: finalZoraTokens.filter((t) => t.coinType === 'ZORA_V4_COIN').length,
          type: 'ZORA',
        },
      };

      const tbaData: TokensData = {
        tokens: finalTbaTokens,
        metadata: {
          lastUpdated: timestamp,
          totalTokens: finalTbaTokens.length,
          creatorCoins: finalTbaTokens.filter((t) => t.coinType === 'ZORA_CREATOR_COIN').length,
          v4Coins: finalTbaTokens.filter((t) => t.coinType === 'ZORA_V4_COIN').length,
          type: 'TBA',
        },
      };

      // Store both with TTL
      await Promise.all([
        this.redisService.set(
          this.config.keys.zoraTokens,
          zoraData,
          this.config.ttl.tokens,
        ),
        this.redisService.set(
          this.config.keys.tbaTokens,
          tbaData,
          this.config.ttl.tokens,
        ),
      ]);

      this.logger.info(
        `Stored ${finalZoraTokens.length} Zora tokens and ${finalTbaTokens.length} TBA tokens`,
      );
    } catch (error) {
      this.logger.error('Failed to store tokens in Redis', error);
      throw error;
    }
  }

  /**
   * Get Zora tokens
   * @returns Array of Zora tokens or null
   */
  async getZoraTokens(): Promise<TokenMetadata[] | null> {
    try {
      const data = await this.redisService.get<TokensData>(this.config.keys.zoraTokens);
      if (!data) return null;
      return data.tokens || null;
    } catch (error) {
      this.logger.error('Failed to get Zora tokens', error);
      return null;
    }
  }

  /**
   * Get TBA tokens
   * @returns Array of TBA tokens or null
   */
  async getTbaTokens(): Promise<TokenMetadata[] | null> {
    try {
      const data = await this.redisService.get<TokensData>(this.config.keys.tbaTokens);
      if (!data) return null;
      return data.tokens || null;
    } catch (error) {
      this.logger.error('Failed to get TBA tokens', error);
      return null;
    }
  }

  /**
   * Get all tokens
   * @returns Combined array of all tokens or null
   */
  async getAllTokens(): Promise<TokenMetadata[] | null> {
    try {
      const [zoraTokens, tbaTokens] = await Promise.all([
        this.getZoraTokens(),
        this.getTbaTokens(),
      ]);

      if (!zoraTokens && !tbaTokens) return null;

      return [...(zoraTokens || []), ...(tbaTokens || [])];
    } catch (error) {
      this.logger.error('Failed to get all tokens', error);
      return null;
    }
  }

  /**
   * Get token metadata
   * @returns Object containing metadata for Zora, TBA, and combined tokens
   */
  async getTokensMetadata() {
    try {
      const [zoraData, tbaData] = await Promise.all([
        this.redisService.get<TokensData>(this.config.keys.zoraTokens),
        this.redisService.get<TokensData>(this.config.keys.tbaTokens),
      ]);

      return {
        zora: zoraData?.metadata || null,
        tba: tbaData?.metadata || null,
        combined: {
          lastUpdated: new Date().toISOString(),
          totalTokens: (zoraData?.metadata?.totalTokens || 0) + (tbaData?.metadata?.totalTokens || 0),
          zoraTokens: zoraData?.metadata?.totalTokens || 0,
          tbaTokens: tbaData?.metadata?.totalTokens || 0,
        },
      };
    } catch (error) {
      this.logger.error('Failed to get tokens metadata', error);
      return null;
    }
  }

  /**
   * Merge existing and new tokens, avoiding duplicates
   * @param existing Existing tokens array
   * @param newTokens New tokens to merge
   * @returns Merged array with duplicates removed
   */
  private mergeTokens(existing: TokenMetadata[], newTokens: TokenMetadata[]): TokenMetadata[] {
    const existingMap = new Map<string, TokenMetadata>();

    // Add existing tokens to map
    existing.forEach((token) => {
      if (token.address) {
        existingMap.set(token.address, token);
      }
    });

    // Update/add new tokens (this will update existing ones with fresh data)
    newTokens.forEach((token) => {
      if (token.address) {
        existingMap.set(token.address, token);
      }
    });

    return Array.from(existingMap.values());
  }
}