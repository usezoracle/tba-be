import { BaseResponse, PaginatedResponse, PaginationMeta, ActionResponse } from '../../../shared/interfaces/api.interfaces';

// Core data interface
export interface WatchlistItem {
  id: string;
  userId: string;
  tokenAddress: string;
  createdAt: Date;
  updatedAt: Date;
  user?: {
    id: string;
    walletAddress: string;
  };
}

// Response interfaces using shared base interfaces
export interface PaginatedWatchlistResponse extends PaginatedResponse<WatchlistItem> {}

export interface AddToWatchlistResponse extends ActionResponse {}

export interface RemoveFromWatchlistResponse extends ActionResponse {}

// Parameter interfaces
export interface AddToWatchlistParams {
  walletAddress: string;
  tokenAddresses: string[];
}

export interface RemoveFromWatchlistParams {
  walletAddress: string;
  tokenAddresses: string[];
}

export interface GetWatchlistParams {
  walletAddress: string;
  page?: number;
  limit?: number;
}
