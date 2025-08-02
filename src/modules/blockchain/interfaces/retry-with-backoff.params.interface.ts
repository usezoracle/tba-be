/**
 * Parameters for retry with backoff functionality
 */
export interface RetryWithBackoffParams<T> {
  fn: () => Promise<T>;
  maxRetries?: number;
  baseDelay?: number;
}