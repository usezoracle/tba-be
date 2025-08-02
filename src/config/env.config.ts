export const config = {
  app: {
    env: process.env.NODE_ENV || 'development',
    name: process.env.APP_NAME || 'Zora TBA Coins API',
    port: parseInt(process.env.PORT || '3000', 10),
  },
  blockchain: {
    rpcUrl: process.env.RPC_URL,
    startBlockNumber: BigInt(process.env.START_BLOCK_NUMBER || '32964917'),
    blockRange: parseInt(process.env.BLOCK_RANGE || '400', 10),
    scanIntervalSeconds: parseInt(process.env.SCAN_INTERVAL_SECONDS || '2', 10),
  },
  redis: {
    upstash: {
      url: process.env.UPSTASH_REDIS_REST_URL,
      token: process.env.UPSTASH_REDIS_REST_TOKEN,
    },
    url: process.env.REDIS_URL || process.env.UPSTASH_REDIS_REST_URL,
  },
  database: {
    url: process.env.DATABASE_URL,
  },
  cors: {
    origins: process.env.CORS_ORIGINS || '*',
  },
  throttle: {
    ttl: parseInt(process.env.THROTTLE_TTL || '60000', 10),
    limit: parseInt(process.env.THROTTLE_LIMIT || '100', 10),
  },
} as const;
