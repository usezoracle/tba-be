# 🏗️ Blockchain & Tokens Architecture Guide

## 📋 Table of Contents

- [System Overview](#system-overview)
- [Architecture Diagram](#architecture-diagram)
- [Module Breakdown](#module-breakdown)
- [Data Flow](#data-flow)
- [Key Components](#key-components)
- [API Endpoints](#api-endpoints)
- [Configuration](#configuration)
- [Monitoring & Debugging](#monitoring--debugging)

## 🌟 System Overview

This system is a **production-grade token discovery platform** that automatically scans Uniswap V4 pools on Base network to find and catalog Zora and TBA (Token Bound Account) tokens. It provides real-time token data through a RESTful API with comprehensive caching and monitoring.

### 🎯 Core Objectives

- **Discover** new tokens from Uniswap V4 pools automatically
- **Classify** tokens by ecosystem (Zora vs TBA) and type (Creator vs V4)
- **Cache** processed data for fast API responses
- **Monitor** system health and data freshness
- **Scale** to handle high-frequency scanning and API requests

## 🏗️ Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                        CLIENT APPLICATIONS                      │
└─────────────────────┬───────────────────────────────────────────┘
                      │ HTTP Requests
                      ▼
┌─────────────────────────────────────────────────────────────────┐
│                     🛣️ TOKENS MODULE                           │
│  ┌─────────────────┐    ┌─────────────────────────────────────┐ │
│  │ TokensController│    │        TokensService                │ │
│  │ • GET /tokens   │◄──►│ • Business Logic                    │ │
│  │ • GET /zora     │    │ • Data Formatting                   │ │
│  │ • GET /tba      │    │ • Error Handling                    │ │
│  │ • POST /scan    │    │                                     │ │
│  └─────────────────┘    └─────────────────┬───────────────────┘ │
└──────────────────────────────────────────┼─────────────────────┘
                                           │
                      ┌────────────────────┼────────────────────┐
                      ▼                    ▼                    ▼
┌─────────────────────────────────────────────────────────────────┐
│                    🔗 BLOCKCHAIN MODULE                         │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────────┐ │
│  │              🎯 TokenScannerService                         │ │
│  │              • Main Orchestrator                            │ │
│  │              • Scheduled Scanning                           │ │
│  │              • Pipeline Coordination                        │ │
│  └─────────────────┬───────────────────────────────────────────┘ │
│                    │                                             │
│  ┌─────────────────▼───────────────────────────────────────────┐ │
│  │                Core Services                                │ │
│  │  ┌─────────────┐ ┌─────────────┐ ┌─────────────────────────┐ │ │
│  │  │Blockchain   │ │PoolProcessor│ │   BlockTimestamp        │ │ │
│  │  │Service      │ │Service      │ │   Service               │ │ │
│  │  │• RPC Calls  │ │• Pool Data  │ │   • Batch Timestamps   │ │ │
│  │  │• Contracts  │ │• Token Meta │ │                         │ │ │
│  │  └─────────────┘ └─────────────┘ └─────────────────────────┘ │ │
│  │                                                             │ │
│  │  ┌─────────────┐ ┌─────────────────────────────────────────┐ │ │
│  │  │Currency     │ │           RetryService                  │ │ │
│  │  │Service      │ │           • Network Resilience          │ │ │
│  │  │• Token Info │ │           • Exponential Backoff         │ │ │
│  │  └─────────────┘ └─────────────────────────────────────────┘ │ │
│  └─────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
                                           │
                                           ▼
┌─────────────────────────────────────────────────────────────────┐
│                    💾 REDIS CACHE                               │
│  • Zora Tokens Cache                                            │
│  • TBA Tokens Cache                                             │
│  • Metadata & Statistics                                        │
│  • TTL Management                                               │
└─────────────────────────────────────────────────────────────────┘
                                           │
                                           ▼
┌─────────────────────────────────────────────────────────────────┐
│                  🌐 BASE NETWORK                                │
│  • Uniswap V4 PoolManager Contract                             │
│  • StateView Contract                                           │
│  • ERC-20 Token Contracts                                       │
└─────────────────────────────────────────────────────────────────┘
```

## 📦 Module Breakdown

### 🪙 Tokens Module

**Purpose**: API layer for external access to token data

**Components**:

- `TokensController`: RESTful endpoints with rate limiting
- `TokensService`: Business logic and data formatting

**Responsibilities**:

- Handle HTTP requests and responses
- Format data for API consumption
- Manage error handling and validation
- Provide debug and monitoring endpoints

### 🔗 Blockchain Module

**Purpose**: Core blockchain interaction and token discovery

**Components**:

- `TokenScannerService`: Main orchestrator
- `BlockchainService`: Low-level blockchain interactions
- `PoolProcessorService`: Pool data processing
- `BlockTimestampService`: Efficient timestamp fetching
- `CurrencyService`: Token metadata fetching
- `RetryService`: Network resilience

**Responsibilities**:

- Scan Uniswap V4 pools for new tokens
- Process pool data into structured metadata
- Handle network failures gracefully
- Classify tokens by type and ecosystem

## 🔄 Data Flow

### 1. 📡 Discovery Phase

```
Scheduler (every 2s) → TokenScannerService → BlockchainService
                                          ↓
                              Fetch pool events from PoolManager
                                          ↓
                              Filter for Zora-related pools
```

### 2. 🏭 Processing Phase

```
Pool Keys → PoolProcessorService → Batch Processing
                                ↓
                    Fetch pool state & token metadata
                                ↓
                    Classify tokens (ZORA/TBA, Creator/V4)
                                ↓
                    Generate structured TokenMetadata
```

### 3. 💾 Storage Phase

```
TokenMetadata[] → RedisService → Store in categorized caches
                              ↓
                    • zora:tokens (Zora ecosystem)
                    • tba:tokens (TBA ecosystem)
                    • metadata (statistics)
```

### 4. 🛣️ API Phase

```
HTTP Request → TokensController → TokensService → RedisService
                                              ↓
                                    Fetch cached data
                                              ↓
                                    Format response
                                              ↓
                                    Return to client
```

## 🔑 Key Components

### 🎯 TokenScannerService

**The Heart of the System**

```typescript
// Main scanning pipeline
async scanTokens(): Promise<ScanResult> {
  1. Calculate block range
  2. Fetch pool events
  3. Transform to pool keys
  4. Filter for Zora pools
  5. Get block timestamps
  6. Process pools in batches
  7. Store in Redis
  8. Return statistics
}
```

**Key Features**:

- Scheduled execution (every 2 seconds)
- Concurrent scan prevention
- Comprehensive error handling
- Detailed logging and metrics

### 🏭 PoolProcessorService

**Token Metadata Extraction Engine**

```typescript
// Batch processing strategy
async processPoolsBatched(params): Promise<TokenMetadata[]> {
  - Process 3 pools simultaneously
  - 300ms delay between batches
  - Parallel processing within batches
  - Graceful error handling
}
```

**Classification Logic**:

- **Coin Type**: Based on hook addresses
  - `zoraCreatorCoin` → `ZORA_CREATOR_COIN`
  - `zoraV4Coin` → `ZORA_V4_COIN`
- **App Type**: Based on token pairings
  - Paired with USDC/WETH → `TBA`
  - Otherwise → `ZORA`

### 🔄 RetryService

**Network Resilience**

```typescript
// Exponential backoff strategy
async retryWithBackoff<T>(params): Promise<T> {
  - Detect rate limiting (HTTP 429)
  - Exponential delays: 1s, 2s, 4s, 8s...
  - Max 3 retries by default
  - Immediate failure for non-retryable errors
}
```

## 🛣️ API Endpoints

### Core Data Endpoints

- `GET /api/v1/tokens` - All tokens (Zora + TBA)
- `GET /api/v1/tokens/zora` - Zora ecosystem tokens only
- `GET /api/v1/tokens/tba` - Token Bound Account tokens only

### Metadata & Monitoring

- `GET /api/v1/tokens/metadata` - Cache statistics
- `GET /api/v1/tokens/debug` - System health information

### Administrative

- `POST /api/v1/tokens/scan` - Trigger manual scan

### Response Format

All endpoints return standardized responses:

```typescript
// Success Response
{
  status: 'success',
  data: {
    tokens: TokenMetadata[],
    count: number,
    type: 'ALL' | 'ZORA' | 'TBA',
    metadata?: CacheMetadata
  },
  timestamp: string
}

// Error Response
{
  status: 'error',
  error: {
    message: string,
    errorType: string
  }
}
```

## ⚙️ Configuration

### Blockchain Settings

```typescript
// src/config/blockchain.config.ts
{
  rpcUrl: string,              // Base network RPC endpoint
  startBlockNumber: bigint,    // Starting block for scanning
  blockRange: number,          // Blocks to scan per iteration
  scanIntervalSeconds: number, // Scanning frequency

  contracts: {
    poolManager: string,       // Uniswap V4 PoolManager
    stateView: string         // StateView for pool queries
  },

  hooks: {
    zoraCreatorCoin: string,  // Zora Creator Coin hook
    zoraV4Coin: string        // Zora V4 Coin hook
  },

  tbaPairings: string[]       // Base currencies for TBA detection
}
```

### Performance Tuning

```typescript
// Batch sizes and delays
BATCH_SIZE = 3; // Pools processed simultaneously
BATCH_DELAY = 300; // Milliseconds between batches
TIMESTAMP_BATCH_SIZE = 10; // Block timestamps per batch
RETRY_MAX_ATTEMPTS = 3; // Maximum retry attempts
```

## 📊 Monitoring & Debugging

### Health Checks

- **Redis Connection**: Verify cache availability
- **Token Counts**: Monitor data freshness
- **Scan Performance**: Track scan duration and success rates
- **Error Rates**: Monitor retry attempts and failures

### Debug Endpoint Response

```json
{
  "redis_status": "connected",
  "zora_tokens_count": 25,
  "tba_tokens_count": 22,
  "zora_exists": true,
  "tba_exists": true,
  "metadata": {
    "combined": {
      "lastUpdated": "2025-01-30T10:30:45.123Z",
      "totalTokens": 47,
      "zoraTokens": 25,
      "tbaTokens": 22
    }
  },
  "timestamp": "2025-01-30T10:30:45.123Z"
}
```

### Logging Strategy

- **Structured Logging**: JSON format with correlation IDs
- **Context-Aware**: Each service has its own logging context
- **Performance Metrics**: Scan duration, batch processing times
- **Error Tracking**: Detailed error information with stack traces

## 🚀 Performance Characteristics

### Scanning Performance

- **Frequency**: Every 2 seconds
- **Block Range**: 400 blocks per scan
- **Batch Processing**: 3 pools simultaneously
- **Rate Limiting**: 300ms delays between batches

### API Performance

- **Caching**: Redis-based with TTL
- **Rate Limiting**: 100 requests/minute
- **Response Time**: Sub-100ms for cached data
- **Concurrent Requests**: Handled via NestJS async architecture

### Scalability Considerations

- **Horizontal Scaling**: Stateless services support clustering
- **Cache Scaling**: Redis can be clustered or sharded
- **Rate Limiting**: Configurable per environment
- **Resource Usage**: Optimized batch processing reduces RPC calls

## 🔧 Development & Maintenance

### Adding New Token Types

1. Update hook addresses in configuration
2. Modify classification logic in `PoolProcessorService`
3. Add new cache keys in Redis configuration
4. Update API endpoints and documentation

### Performance Optimization

1. Adjust batch sizes based on RPC provider limits
2. Tune retry parameters for network conditions
3. Optimize Redis TTL values
4. Monitor and adjust scanning frequency

### Troubleshooting Common Issues

- **High RPC Usage**: Increase batch delays
- **Missing Tokens**: Check hook address configuration
- **Cache Misses**: Verify Redis connectivity
- **Scan Failures**: Review retry logic and error handling

This architecture provides a robust, scalable foundation for token discovery with comprehensive monitoring, error handling, and performance optimization.
