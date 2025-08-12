# Zora TBA Coins NestJS Backend

A production-grade NestJS backend service that scans Uniswap V4 pools for Zora and TBA token data, providing a robust REST API with Redis caching, comprehensive error handling, and automated scanning.

## 🚀 Features

- **Production-Ready Architecture**: Built with NestJS following best practices
- **Automated Token Scanning**: Cron job runs every 2 seconds to fetch latest blockchain data
- **Redis Caching**: Fast data retrieval with Upstash Redis integration
- **Comprehensive API**: RESTful endpoints with OpenAPI/Swagger documentation
- **Error Handling**: Global exception filters and proper HTTP status codes
- **Rate Limiting**: Built-in throttling to prevent API abuse
- **Logging**: Structured async logging with Pino
- **Testing**: Unit and E2E tests with Jest
- **Type Safety**: Full TypeScript implementation with strict typing
- **Configuration Management**: Environment-based configuration with validation

## 📋 Prerequisites

- Node.js 18+
- npm/yarn/pnpm
- Upstash Redis account
- Alchemy API key for Base network

## 🛠️ Installation

1. **Clone the repository**

   ```bash
   git clone <repository-url>
   cd zora-tba-coins-nestjs
   ```

2. **Install dependencies**

   ```bash
   npm install
   # or
   yarn install
   ```

3. **Environment setup**

   ```bash
   cp .env.example .env
   ```

   Edit `.env` with your configuration:

   ```env
   NODE_ENV=development
   PORT=3000
   RPC_URL=https://base-mainnet.g.alchemy.com/v2/your-api-key
   UPSTASH_REDIS_REST_URL=https://your-redis-url.upstash.io
   UPSTASH_REDIS_REST_TOKEN=your-redis-token
   ```

4. **Start the application**

   ```bash
   # Development
   npm run start:dev

   # Production
   npm run build
   npm run start:prod
   ```

## 📚 API Documentation

Once running, visit:

- **Swagger UI**: `http://localhost:3000/api/docs`
- **API Base URL**: `http://localhost:3000/api/v1`

### Available Endpoints

#### Health Check

```http
GET /api/v1/health
GET /api/v1/health/detailed
```

#### Token Endpoints

```http
GET /api/v1/tokens          # Get all tokens (Zora + TBA)
GET /api/v1/tokens/zora     # Get Zora tokens only
GET /api/v1/tokens/tba      # Get TBA tokens only
GET /api/v1/tokens/metadata # Get tokens statistics
POST /api/v1/tokens/scan    # Trigger manual scan
GET /api/v1/tokens/debug    # Debug information
```

#### Application Info

```http
GET /api/v1/                # Application information
```

## 🏗️ Architecture

### Project Structure

```
src/
├── app.module.ts           # Root module
├── main.ts                 # Application bootstrap
├── common/                 # Shared utilities
│   ├── filters/           # Exception filters
│   └── interceptors/      # Request/response interceptors
├── config/                # Configuration files
│   ├── blockchain.config.ts
│   ├── redis.config.ts
│   └── config.validation.ts
├── modules/               # Feature modules
│   ├── blockchain/        # Blockchain scanning logic
│   ├── health/           # Health check endpoints
│   ├── redis/            # Redis service
│   └── tokens/           # Token API endpoints
└── shared/               # Shared interfaces and DTOs
    ├── dto/
    └── interfaces/
```

### Key Components

#### 1. **Token Scanner Service**

- Automated scanning every 2 seconds
- Batch processing to avoid rate limits
- Retry logic with exponential backoff
- Token classification (Zora vs TBA)

#### 2. **Redis Service**

- Upstash Redis integration
- Token data caching with TTL
- Separate storage for Zora and TBA tokens
- Metadata tracking

#### 3. **API Controllers**

- RESTful endpoints
- Input validation with DTOs
- Swagger documentation
- Rate limiting protection

#### 4. **Configuration Management**

- Environment-based configuration
- Joi validation schema
- Type-safe configuration injection

## 🧪 Testing

```bash
# Unit tests
npm run test

# E2E tests
npm run test:e2e

# Test coverage
npm run test:cov

# Watch mode
npm run test:watch
```

## 📊 Monitoring & Logging

### Logging

- Structured async logging with Pino
- Non-blocking logging operations for optimal performance
- Context-aware logging with correlation IDs
- Pretty printing in development, JSON in production
- Request/response logging
- Error tracking with stack traces
- Log files: `logs/error.log`, `logs/combined.log`

### Health Checks

- Basic health endpoint
- Detailed health with dependency status
- System metrics (memory, CPU, uptime)

## 🔧 Configuration

### Environment Variables

| Variable                   | Description                               | Default       |
| -------------------------- | ----------------------------------------- | ------------- |
| `NODE_ENV`                 | Environment (development/production/test) | `development` |
| `PORT`                     | Server port                               | `3000`        |
| `RPC_URL`                  | Base network RPC URL                      | Required      |
| `UPSTASH_REDIS_REST_URL`   | Upstash Redis URL                         | Required      |
| `UPSTASH_REDIS_REST_TOKEN` | Upstash Redis token                       | Required      |
| `CORS_ORIGINS`             | Allowed CORS origins                      | `*`           |
| `SCAN_INTERVAL_SECONDS`    | Scanning interval                         | `2`           |
| `START_BLOCK_NUMBER`       | Starting block for scanning               | `32964917`    |
| `BLOCK_RANGE`              | Number of blocks to scan                  | `400`         |

### Blockchain Configuration

- **Network**: Base (Ethereum L2)
- **Uniswap V4 Pool Manager**: `0x498581ff718922c3f8e6a244956af099b2652b2b`
- **State View Contract**: `0xa3c0c9b65bad0b08107aa264b0f3db444b867a71`

### Token Classification

- **Zora Creator Coin Hook**: `0xd61A675F8a0c67A73DC3B54FB7318B4D91409040`
- **Zora V4 Coin Hook**: `0x9ea932730A7787000042e34390B8E435dD839040`
- **TBA Pairings**: USDC (`0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913`), WETH (`0x4200000000000000000000000000000000000006`)

## 🚀 Deployment

### Docker (Optional)

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY dist ./dist
EXPOSE 3000
CMD ["node", "dist/main"]
```

### Production Checklist

- [ ] Set `NODE_ENV=production`
- [ ] Configure proper Redis TTL values
- [ ] Set up monitoring and alerting
- [ ] Configure reverse proxy (nginx)
- [ ] Set up SSL/TLS certificates
- [ ] Configure log rotation
- [ ] Set up health check monitoring

## 🔍 Troubleshooting

### Common Issues

1. **Rate Limiting Errors**
   - Increase batch delays in `token-scanner.service.ts`
   - Upgrade Alchemy plan for higher rate limits

2. **Redis Connection Issues**
   - Verify Upstash credentials
   - Check network connectivity
   - Review Redis service logs

3. **Token Data Not Updating**
   - Check cron job logs
   - Verify blockchain RPC connectivity
   - Review scanning service errors

### Debug Endpoints

```bash
# Check Redis status
curl http://localhost:3000/api/v1/tokens/debug

# Trigger manual scan
curl -X POST http://localhost:3000/api/v1/tokens/scan

# Check detailed health
curl http://localhost:3000/api/v1/health/detailed
```

## 📈 Performance Optimization

- **Batch Processing**: Processes pools in batches to avoid rate limits
- **Redis Caching**: 1-hour TTL for token data
- **Connection Pooling**: Efficient HTTP client usage
- **Memory Management**: Proper cleanup and garbage collection
- **Rate Limiting**: Prevents API abuse

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Run the test suite
6. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

For support and questions:

- Create an issue in the repository
- Check the troubleshooting section
- Review the API documentation at `/api/docs`
