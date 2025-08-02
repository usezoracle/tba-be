import { PoolKey } from '@uniswap/v4-sdk';

/**
 * Parameters for processing a single pool
 */
export interface ProcessPoolParams {
  key: PoolKey & { blockNumber: bigint };
  blockTimestampCache: Map<bigint, bigint>;
}