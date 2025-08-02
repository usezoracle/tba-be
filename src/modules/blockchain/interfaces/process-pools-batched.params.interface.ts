import { PoolKey } from '@uniswap/v4-sdk';

/**
 * Parameters for processing pools in batches
 */
export interface ProcessPoolsBatchedParams {
  poolKeys: (PoolKey & { blockNumber: bigint })[];
  blockTimestampCache: Map<bigint, bigint>;
}