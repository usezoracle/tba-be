/**
 * Batch process items in chunks
 * 
 * @param items Array of items to process
 * @param processor Function to process each item
 * @param batchSize Number of items to process in parallel (default: 10)
 * @param delay Delay in ms between batches (default: 0)
 * @returns Array of processed results
 */
export async function batching<T, R>(
  items: T[],
  processor: (item: T) => Promise<R>,
  batchSize: number = 10,
  delay: number = 0
): Promise<R[]> {
  const results: R[] = [];
  
  for (let i = 0; i < items.length; i += batchSize) {
    const batch = items.slice(i, i + batchSize);
    const batchResults = await Promise.all(
      batch.map(item => processor(item))
    );
    results.push(...batchResults);
    
    if (i + batchSize < items.length && delay > 0) {
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  return results;
}