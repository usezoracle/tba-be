import * as Joi from 'joi';

export const configValidationSchema = Joi.object({
  // App configuration
  NODE_ENV: Joi.string()
    .valid('development', 'production', 'test')
    .default('development'),
  APP_NAME: Joi.string().default('NestJS API'),
  PORT: Joi.number().default(3000),

  // Redis configuration (ioredis URL only)
  UPSTASH_REDIS_URL: Joi.string().uri().required(),

  // Database configuration
  DATABASE_URL: Joi.string().optional(),

  // CORS
  CORS_ORIGINS: Joi.string().default('*'),

  // Rate limiting
  THROTTLE_TTL: Joi.number().default(60000),
  THROTTLE_LIMIT: Joi.number().default(100),

  // Codex API key
  CODEX_API_KEY: Joi.string().required(),
  CODEX_BASE_URL: Joi.string().required(),
});
