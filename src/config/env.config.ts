export const config = {
  app: {
    env: process.env.NODE_ENV || 'development',
    name: process.env.APP_NAME || 'NestJS API',
    port: parseInt(process.env.PORT || '3000', 10),
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
  codex: {
    apiKey: process.env.CODEX_API_KEY,
    baseUrl: process.env.CODEX_BASE_URL ,
  },
  cors: {
    origins: process.env.CORS_ORIGINS || '*',
  },
  throttle: {
    ttl: parseInt(process.env.THROTTLE_TTL || '60000', 10),
    limit: parseInt(process.env.THROTTLE_LIMIT || '100', 10),
  },
} as const;
