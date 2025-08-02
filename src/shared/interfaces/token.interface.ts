/**
 * Metadata for a blockchain token
 */
export interface TokenMetadata {
  id: string;
  name: string;
  symbol: string;
  poolAddress?: string;
  currency0?: string;
  currency1?: string;
  fee?: number;
  blockNumber?: string;
  timestamp?: number;
  createdAt?: Date;
  updatedAt?: Date;
  appType?: string; // 'ZORA' or 'TBA'
  coinType?: string; // 'ZORA_CREATOR_COIN' or 'ZORA_V4_COIN'
  decimals?: number;
  address?: string;
  tick?: number;
  sqrtPriceX96?: string;
  price?: string;
  timestampISO?: string;
}

/**
 * Results from a blockchain token scan operation
 */
export interface ScanResult {
  blocksScanned: number;
  startBlock: string;
  endBlock: string;
  poolsDiscovered: number;
  tokensAdded: number;
  tokensFound?: number;
  zoraTokens?: number;
  tbaTokens?: number;
  scanDuration: number;
  timestamp: string; // ISO string format
}