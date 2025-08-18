export interface PaginationParams {
  page: number;
  limit: number;
}

export interface PaginationResult {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  skip: number;
}

export function calculatePagination(params: PaginationParams, total: number): PaginationResult {
  const { page, limit } = params;
  const totalPages = Math.ceil(total / limit);
  const skip = (page - 1) * limit;

  return {
    total,
    page,
    limit,
    totalPages,
    skip,
  };
}

export function validatePaginationParams(page: number, limit: number): PaginationParams {
  const validatedPage = Math.max(1, page);
  const validatedLimit = Math.min(100, Math.max(1, limit));
  
  return {
    page: validatedPage,
    limit: validatedLimit,
  };
}
