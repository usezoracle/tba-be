import * as Joi from 'joi';

export const configValidationSchema = Joi.object({
  // App configuration
  NODE_ENV: Joi.string()
    .valid('development', 'production', 'test')
    .default('development'),
  APP_NAME: Joi.string().default('Zora TBA Coins API'),
  PORT: Joi.number().default(3000),
  
  // Blockchain configuration
  RPC_URL: Joi.string().required(),
  START_BLOCK_NUMBER: Joi.string().default('32964917'),
  BLOCK_RANGE: Joi.number().default(400),
  SCAN_INTERVAL_SECONDS: Joi.number().default(2),
  
  // Redis configuration (Upstash)
  UPSTASH_REDIS_REST_URL: Joi.string().required(),
  UPSTASH_REDIS_REST_TOKEN: Joi.string().required(),
  
  // Redis URL for infrastructure (optional, can fallback to Upstash)
  REDIS_URL: Joi.string().optional(),
  
  // Database configuration
  DATABASE_URL: Joi.string().optional(),
  
  // CORS
  CORS_ORIGINS: Joi.string().default('*'),
  
  // Rate limiting
  THROTTLE_TTL: Joi.number().default(60000),
  THROTTLE_LIMIT: Joi.number().default(100),
});