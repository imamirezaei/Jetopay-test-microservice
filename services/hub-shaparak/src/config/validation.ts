// config/validation.ts
import * as Joi from 'joi';

export const validationSchema = Joi.object({
  NODE_ENV: Joi.string().valid('development', 'production', 'test').default('development'),
  PORT: Joi.number().default(3006),
  
  // Database validation
  DB_HOST: Joi.string().default('localhost'),
  DB_PORT: Joi.number().default(5432),
  DB_USERNAME: Joi.string().default('postgres'),
  DB_PASSWORD: Joi.string().default('postgres'),
  DB_DATABASE: Joi.string().default('jetopay_hub_shaparak'),
  DB_SYNC: Joi.boolean().default(false),
  DB_SSL: Joi.boolean().default(false),
  DB_LOGGING: Joi.boolean().default(false),
  
  // RabbitMQ validation
  RABBITMQ_URL: Joi.string().default('amqp://localhost:5672'),
  
  // CORS validation
  CORS_ORIGIN: Joi.string().default('*'),
  
  // Rate limiting validation
  THROTTLE_TTL: Joi.number().default(60),
  THROTTLE_LIMIT: Joi.number().default(10),
  
  // Transaction settings validation
  TRANSACTION_TIMEOUT_MS: Joi.number().default(30000),
  MAX_RETRY_ATTEMPTS: Joi.number().default(3),
  
  // CBI settings validation
  CBI_API_URL: Joi.string().default('https://api.cbi.ir'),
  CBI_API_KEY: Joi.string().optional(),
  
  // Shaparak settings validation
  SHAPARAK_API_URL: Joi.string().default('https://api.shaparak.ir'),
  SHAPARAK_MERCHANT_ID: Joi.string().optional(),
  SHAPARAK_TERMINAL_ID: Joi.string().optional(),
  
  // Redis validation
  REDIS_HOST: Joi.string().default('localhost'),
  REDIS_PORT: Joi.number().default(6379),
  REDIS_PASSWORD: Joi.string().optional(),
});