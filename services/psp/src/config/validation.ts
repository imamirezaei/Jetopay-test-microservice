// src/config/validation.ts
import * as Joi from 'joi';

export const validationSchema = Joi.object({
  // Application
  NODE_ENV: Joi.string()
    .valid('development', 'production', 'test')
    .default('development'),
  PORT: Joi.number().default(3003),
  
  // Database
  DB_HOST: Joi.string().default('localhost'),
  DB_PORT: Joi.number().default(5432),
  DB_USERNAME: Joi.string().default('postgres'),
  DB_PASSWORD: Joi.string().default('postgres'),
  DB_DATABASE: Joi.string().default('jetopay_psp'),
  DB_SYNC: Joi.boolean().default(false),
  DB_LOGGING: Joi.boolean().default(false),
  
  // RabbitMQ
  RABBITMQ_URL: Joi.string().default('amqp://localhost:5672'),
  
  // PSP Integration
  SHAPARAK_API_KEY: Joi.string().optional(),
  SHAPARAK_API_URL: Joi.string().default('https://api.shaparak.ir/v1'),
  SHETAB_API_KEY: Joi.string().optional(),
  SHETAB_API_URL: Joi.string().default('https://api.shetab.ir/v1'),
  
  // CORS
  CORS_ORIGIN: Joi.string().default('*'),
  
  // API Rate limiting
  THROTTLE_TTL: Joi.number().default(60),
  THROTTLE_LIMIT: Joi.number().default(20),
  
  // Redis (for caching)
  REDIS_HOST: Joi.string().default('localhost'),
  REDIS_PORT: Joi.number().default(6379),
  REDIS_PASSWORD: Joi.string().allow(null, '').default(null),
  
  // Transaction settings
  TRANSACTION_TIMEOUT_SECONDS: Joi.number().default(900),
  MAX_PAYMENT_ATTEMPTS: Joi.number().default(3),
  
  // Fraud detection
  FRAUD_DETECTION_ENABLED: Joi.boolean().default(true),
  HIGH_AMOUNT_THRESHOLD: Joi.number().default(100000000),
  MAX_DAILY_TRANSACTIONS: Joi.number().default(20),
  
  // Logging
  LOG_LEVEL: Joi.string()
    .valid('error', 'warn', 'info', 'http', 'verbose', 'debug', 'silly')
    .default('info'),
  LOG_FILE_PATH: Joi.string().default('logs/psp-service.log'),
  
  // Metrics
  METRICS_ENABLED: Joi.boolean().default(false),
  METRICS_PORT: Joi.number().default(9464),
});