# API Response Standards

This document outlines the standardized response format implemented across all API endpoints in the Zora TBA Coins NestJS application.

## Overview

All API responses follow a consistent structure to ensure predictable client integration and better error handling. The system uses:

- **Global Response Interceptor**: Automatically wraps successful responses
- **Global Exception Filter**: Standardizes error responses
- **Strong Typing**: TypeScript interfaces for response consistency

## Success Response Format

All successful API responses follow this structure:

```typescript
{
  "status": "success",
  "data": T, // The actual response data
  "timestamp": "2025-07-30T01:23:45.678Z"
}
```

### Example Success Responses

#### Application Info
```json
{
  "status": "success",
  "data": {
    "name": "Zora TBA Coins API",
    "version": "1.0.0",
    "description": "Production-grade API for Zora and TBA token data",
    "environment": "development",
    "timestamp": "2025-07-30T01:23:45.678Z"
  },
  "timestamp": "2025-07-30T01:23:45.678Z"
}
```

#### Health Check
```json
{
  "status": "success",
  "data": {
    "status": "ok",
    "timestamp": "2025-07-30T01:23:45.678Z",
    "uptime": 12345,
    "version": "1.0.0",
    "environment": "development"
  },
  "timestamp": "2025-07-30T01:23:45.678Z"
}
```

#### Token Data
```json
{
  "status": "success",
  "data": {
    "tokens": [
      {
        "id": "0x123...",
        "name": "Example Token",
        "symbol": "EXT",
        "decimals": 18,
        "address": "0xabc...",
        "tick": 12345,
        "sqrtPriceX96": "123456789...",
        "price": "0.001234",
        "coinType": "ZORA_CREATOR_COIN",
        "appType": "TBA",
        "blockNumber": "32965000",
        "timestamp": 1704067200,
        "timestampISO": "2024-01-01T00:00:00.000Z"
      }
    ],
    "count": 1,
    "type": "ALL"
  },
  "timestamp": "2025-07-30T01:23:45.678Z"
}
```

## Error Response Format

All error responses follow this structure:

```typescript
{
  "status": "error",
  "message": string,
  "timestamp": "2025-07-30T01:23:45.678Z",
  "path": string,
  "statusCode"?: number, // Optional, included for non-500 errors
  "details"?: any        // Optional, additional error context
}
```

### Example Error Responses

#### Not Found (404)
```json
{
  "status": "error",
  "message": "No tokens found",
  "timestamp": "2025-07-30T01:23:45.678Z",
  "path": "/api/v1/tokens",
  "statusCode": 404
}
```

#### Validation Error (400)
```json
{
  "status": "error",
  "message": "Validation failed: symbol must be a string, decimals must be a number",
  "timestamp": "2025-07-30T01:23:45.678Z",
  "path": "/api/v1/tokens",
  "statusCode": 400
}
```

#### Internal Server Error (500)
```json
{
  "status": "error",
  "message": "Internal server error",
  "timestamp": "2025-07-30T01:23:45.678Z",
  "path": "/api/v1/tokens"
}
```

#### Rate Limit Error (429)
```json
{
  "status": "error",
  "message": "Too many requests",
  "timestamp": "2025-07-30T01:23:45.678Z",
  "path": "/api/v1/tokens",
  "statusCode": 429
}
```

## Implementation Details

### Global Response Interceptor

Located at `src/common/interceptors/response.interceptor.ts`:

```typescript
@Injectable()
export class ResponseInterceptor<T>
  implements NestInterceptor<T, StandardApiResponse<T>>
{
  intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Observable<StandardApiResponse<T>> {
    return next.handle().pipe(
      map((data) => ({
        status: 'success' as const,
        data,
        timestamp: new Date().toISOString(),
      })),
    );
  }
}
```

### Global Exception Filter

Located at `src/common/filters/all-exceptions.filter.ts`:

```typescript
@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost): void {
    // ... error handling logic
    
    const errorResponse: StandardErrorResponse = {
      status: 'error',
      message,
      timestamp: new Date().toISOString(),
      path: request.url,
      ...(status !== HttpStatus.INTERNAL_SERVER_ERROR && { statusCode: status }),
      ...(details && { details }),
    };

    response.status(status).json(errorResponse);
  }
}
```

### Controller Implementation

Controllers return plain data objects, which are automatically wrapped by the interceptor:

```typescript
@Get()
async getAllTokens(): Promise<TokensDataDto> {
  const result = await this.tokensService.getAllTokens();
  if (!result) {
    throw new HttpException('No tokens found', HttpStatus.NOT_FOUND);
  }
  return result; // Plain data - interceptor will wrap it
}
```

## Type Safety

### Response DTOs

```typescript
// Generic success response type
export class StandardSuccessResponseDto<T> {
  @ApiProperty({ enum: ['success'] })
  status: 'success';

  @ApiProperty({ type: 'object' })
  data: T;

  @ApiProperty({ example: '2025-07-30T01:23:45.678Z' })
  timestamp: string;
}

// Error response type
export class StandardErrorResponseDto {
  @ApiProperty({ enum: ['error'] })
  status: 'error';

  @ApiProperty({ example: 'Resource not found' })
  message: string;

  @ApiProperty({ example: '2025-07-30T01:23:45.678Z' })
  timestamp: string;

  @ApiProperty({ example: '/api/v1/tokens/123' })
  path: string;

  @ApiProperty({ example: 404, required: false })
  statusCode?: number;

  @ApiProperty({ required: false })
  details?: any;
}
```

## Swagger Documentation

All endpoints are documented with proper response examples:

```typescript
@ApiResponse({
  status: 200,
  description: 'Successfully retrieved all tokens',
  schema: {
    example: {
      status: 'success',
      data: {
        tokens: [...],
        count: 47,
        type: 'ALL'
      },
      timestamp: '2025-07-30T01:23:45.678Z'
    }
  }
})
```

## Testing

### Unit Tests

Services return plain data, making them easy to test:

```typescript
it('should return all tokens when available', async () => {
  const result = await service.getAllTokens();
  expect(result).toEqual({
    tokens: mockTokens,
    count: 1,
    type: 'ALL',
    metadata: { totalTokens: 1 },
  });
});
```

### Integration Tests

E2E tests verify the complete response format:

```typescript
it('should return standardized success response', () => {
  return request(app.getHttpServer())
    .get('/api/v1/tokens')
    .expect(200)
    .expect((res) => {
      expect(res.body).toHaveProperty('status', 'success');
      expect(res.body).toHaveProperty('data');
      expect(res.body).toHaveProperty('timestamp');
    });
});
```

## Benefits

1. **Consistency**: All responses follow the same structure
2. **Predictability**: Clients can rely on consistent response format
3. **Error Handling**: Standardized error responses make client error handling easier
4. **Type Safety**: Strong typing prevents response format drift
5. **Documentation**: Swagger automatically documents the response format
6. **Testing**: Easier to test with consistent response structure
7. **Debugging**: Timestamps and paths help with debugging
8. **Monitoring**: Consistent format enables better monitoring and logging

## Migration Guide

If you have existing endpoints that don't follow this format:

1. **Remove manual response wrapping** from controllers
2. **Return plain data objects** from controller methods
3. **Use HttpException** for errors instead of manual error responses
4. **Update Swagger decorators** to reflect the new response format
5. **Update tests** to expect the new response structure

The global interceptor and filter will automatically handle the response formatting.