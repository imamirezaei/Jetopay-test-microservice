// config/validation.ts
import * as Joi from 'joi';

export const validationSchema = Joi.object({
  NODE_ENV: Joi.string().valid('development', 'production', 'test').default('development'),
  PORT: Joi.number().default(3004),
  
  // Database validation
  DB_HOST: Joi.string().default('localhost'),
  DB_PORT: Joi.number().default(5432),
  DB_USERNAME: Joi.string().default('postgres'),
  DB_PASSWORD: Joi.string().default('postgres'),
  DB_DATABASE: Joi.string().default('jetopay_shetab'),
  DB_SYNC: Joi.boolean().default(false),
  DB_SSL: Joi.boolean().default(false),
  DB_LOGGING: Joi.boolean().default(false),
  
  // RabbitMQ validation
  RABBITMQ_URL: Joi.string().default('amqp://localhost:5672'),
  
  // Shetab Network Configuration
  SHETAB_API_URL: Joi.string().default('https://api.shetab.ir'),
  SHETAB_API_KEY: Joi.string().when('NODE_ENV', {
    is: 'production',
    then: Joi.required(),
    otherwise: Joi.optional(),
  }),
  SHETAB_API_SECRET: Joi.string().when('NODE_ENV', {
    is: 'production',
    then: Joi.required(),
    otherwise: Joi.optional(),
  }),
  
  // Transaction Fees
  INTERBANK_BASE_FEE: Joi.number().default(10000),
  MAX_FEE_CAP: Joi.number().default(100000),
  FEE_PERCENTAGE: Joi.number().default(0.001),
  
  // Settlement Configuration
  SETTLEMENT_BATCH_SIZE: Joi.number().default(1000),
  SETTLEMENT_TIME: Joi.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).default('23:30'),
  SETTLEMENT_RETRY_COUNT: Joi.number().default(3),
  
  // Timeouts and Limits
  TRANSACTION_TIMEOUT_SECONDS: Joi.number().default(60),
  MAX_RETRIES: Joi.number().default(3),
  MAX_TRANSACTION_AMOUNT: Joi.number().default(1000000000),
});