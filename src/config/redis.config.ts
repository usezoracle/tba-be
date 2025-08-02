import { registerAs } from '@nestjs/config';

export default registerAs('redis', () => ({
  url: process.env.UPSTASH_REDIS_REST_URL,
  token: process.env.UPSTASH_REDIS_REST_TOKEN,
  ttl: {
    tokens: 3600, // 1 hour
    metadata: 3600, // 1 hour
  },
  keys: {
    zoraTokens: 'zora:tokens',
    tbaTokens: 'tba:tokens',
    metadata: 'tokens:metadata',
  },
}));