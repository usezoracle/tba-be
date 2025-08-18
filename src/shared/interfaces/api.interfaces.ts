// Base response interfaces for consistent API structure
export interface BaseResponse {
  message?: string;
}

export interface PaginationMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface PaginatedResponse<T> extends BaseResponse {
  data: T[];
  pagination: PaginationMeta;
}

export interface CountResponse extends BaseResponse {
  count: number;
}

export interface ActionResponse extends BaseResponse {
  data: {
    actionCount?: number;
    addedCount?: number;
    removedCount?: number;
    count?: number;
  };
} 
