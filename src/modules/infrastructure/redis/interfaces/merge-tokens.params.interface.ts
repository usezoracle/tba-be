import { TokenMetadata } from '../../../../shared';

/**
 * Parameters for merging existing and new tokens
 */
export interface MergeTokensParams {
  existing: TokenMetadata[] | null;
  newTokens: TokenMetadata[];
}