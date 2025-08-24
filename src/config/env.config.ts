export const config = {
  app: {
    env: process.env.NODE_ENV || 'development',
    name: process.env.APP_NAME || 'NestJS API',
    port: parseInt(process.env.PORT || '3000', 10),
  },
  redis: {
    // Single ioredis URL (TLS in prod: rediss://default:<token>@<host>.upstash.io:6379)
    url: process.env.UPSTASH_REDIS_URL,
  },
  database: {
    url: process.env.DATABASE_URL, // Pooled connection (PgBouncer)
    directUrl: process.env.DIRECT_URL, // Direct connection for migrations/schema operations
    poolSize: parseInt(process.env.DATABASE_POOL_SIZE || '10', 10),
    connectionTimeout: parseInt(process.env.DATABASE_CONNECTION_TIMEOUT || '30000', 10),
  },
  codex: {
    apiKey: process.env.CODEX_API_KEY,
    baseUrl: process.env.CODEX_BASE_URL ,
  },
  cors: {
    origins: 'https://usezoracle.xyz,https://zoracle.xyz,https://v2.usezoracle.xyz,https://v2.zoracle.xyz,http://localhost:3000',
  },
  throttle: {
    ttl: parseInt(process.env.THROTTLE_TTL || '60000', 10),
    limit: parseInt(process.env.THROTTLE_LIMIT || '100', 10),
  },
} as const;
