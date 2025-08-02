# Function Refactoring Summary

This document summarizes all the functions that were refactored to use a single params object with typed interfaces.

## Refactored Functions

### 1. BlockchainService

#### `getContractEvents`
- **Before**: `async getContractEvents(fromBlock: bigint, toBlock: bigint)`
- **After**: `async getContractEvents(params: GetContractEventsParams)`
- **Interface**: `src/interfaces/get-contract-events.params.interface.ts`

### 2. TokenScannerService

#### `getCurrency`
- **Before**: `private async getCurrency(address: string, publicClient: any): Promise<Currency>`
- **After**: `private async getCurrency(params: GetCurrencyParams): Promise<Currency>`
- **Interface**: `src/interfaces/get-currency.params.interface.ts`

#### `processPoolsBatched`
- **Before**: `private async processPoolsBatched(poolKeys: (PoolKey & { blockNumber: bigint })[], blockTimestampCache: Map<bigint, bigint>): Promise<TokenMetadata[]>`
- **After**: `private async processPoolsBatched(params: ProcessPoolsBatchedParams): Promise<TokenMetadata[]>`
- **Interface**: `src/interfaces/process-pools-batched.params.interface.ts`

#### `processPool`
- **Before**: `private async processPool(key: PoolKey & { blockNumber: bigint }, blockTimestampCache: Map<bigint, bigint>): Promise<TokenMetadata | null>`
- **After**: `private async processPool(params: ProcessPoolParams): Promise<TokenMetadata | null>`
- **Interface**: `src/interfaces/process-pool.params.interface.ts`

#### `retryWithBackoff`
- **Before**: `private async retryWithBackoff<T>(fn: () => Promise<T>, maxRetries: number = 3, baseDelay: number = 1000): Promise<T>`
- **After**: `private async retryWithBackoff<T>(params: RetryWithBackoffParams<T>): Promise<T>`
- **Interface**: `src/interfaces/retry-with-backoff.params.interface.ts`

### 3. RedisService

#### `mergeTokens`
- **Before**: `private mergeTokens(existing: TokenMetadata[] | null, newTokens: TokenMetadata[]): TokenMetadata[]`
- **After**: `private mergeTokens(params: MergeTokensParams): TokenMetadata[]`
- **Interface**: `src/interfaces/merge-tokens.params.interface.ts`

### 4. Response Helper Functions

#### `createErrorResponse`
- **Before**: `export function createErrorResponse(message: string, path: string, statusCode?: number, details?: any): StandardErrorResponseDto`
- **After**: `export function createErrorResponse(params: CreateErrorResponseParams): StandardErrorResponseDto`
- **Interface**: `src/interfaces/create-error-response.params.interface.ts`

## Interface Files Created

All interface files are located in `src/interfaces/` and follow the naming convention:
- **File naming**: kebab-case (e.g., `get-contract-events.params.interface.ts`)
- **Interface naming**: PascalCase (e.g., `GetContractEventsParams`)

### List of Interface Files

1. `src/interfaces/get-contract-events.params.interface.ts`
2. `src/interfaces/get-currency.params.interface.ts`
3. `src/interfaces/process-pools-batched.params.interface.ts`
4. `src/interfaces/process-pool.params.interface.ts`
5. `src/interfaces/retry-with-backoff.params.interface.ts`
6. `src/interfaces/merge-tokens.params.interface.ts`
7. `src/interfaces/create-error-response.params.interface.ts`

## Functions Not Refactored

The following functions were not refactored because they are NestJS interface implementations that must maintain their original signatures:

1. **Exception Filters**: `catch(exception: unknown, host: ArgumentsHost): void`
2. **Interceptors**: `intercept(context: ExecutionContext, next: CallHandler): Observable<any>`
3. **Guards, Pipes, and other NestJS decorators**: These must implement specific interfaces

## Benefits of Refactoring

1. **Improved Readability**: Function signatures are cleaner and easier to understand
2. **Better Type Safety**: Each parameter set is strongly typed with its own interface
3. **Enhanced Maintainability**: Adding new parameters only requires updating the interface
4. **Consistent API**: All functions follow the same pattern for parameter passing
5. **Better IDE Support**: IntelliSense and auto-completion work better with typed interfaces
6. **Easier Testing**: Mock objects can be created more easily with typed interfaces

## Usage Examples

### Before Refactoring
```typescript
// Multiple parameters
await this.blockchainService.getContractEvents(startBlock, endBlock);
await this.getCurrency(address, publicClient);
```

### After Refactoring
```typescript
// Single params object
await this.blockchainService.getContractEvents({ fromBlock: startBlock, toBlock: endBlock });
await this.getCurrency({ address, publicClient });
```

## Import Updates

All files that use the refactored functions have been updated to import the necessary parameter interfaces:

```typescript
import { GetContractEventsParams } from '../../interfaces/get-contract-events.params.interface';
import { GetCurrencyParams } from '../../interfaces/get-currency.params.interface';
// ... other imports
```

## Testing Considerations

- All function calls have been updated to use the new parameter format
- No breaking changes to public APIs (controllers remain unchanged)
- Internal service methods now use the new parameter pattern
- Mock objects in tests should be updated to match the new interfaces if needed

This refactoring improves code maintainability and follows modern TypeScript best practices for function parameter handling.