// config/validation.ts
import * as Joi from 'joi';
  
export const validationSchema = Joi.object({
  NODE_ENV: Joi.string().valid('development', 'production', 'test').default('development'),
  PORT: Joi.number().default(3007),
  
  // Database validation
  DB_HOST: Joi.string().default('localhost'),
  DB_PORT: Joi.number().default(5432),
  DB_USERNAME: Joi.string().default('postgres'),
  DB_PASSWORD: Joi.string().default('postgres'),
  DB_DATABASE: Joi.string().default('jetopay_gateway'),
  DB_SYNC: Joi.boolean().default(false),
  DB_SSL: Joi.boolean().default(false),
  DB_LOGGING: Joi.boolean().default(false),
  
  // RabbitMQ validation
  RABBITMQ_URL: Joi.string().default('amqp://localhost:5672'),
  
  // JWT validation
  JWT_SECRET: Joi.string().required(),
  JWT_ACCESS_EXPIRATION: Joi.string().default('15m'),
  JWT_REFRESH_EXPIRATION: Joi.string().default('7d'),
  
  // CORS validation
  CORS_ORIGIN: Joi.string().default('*'),
  
  // Rate limiting validation
  THROTTLE_TTL: Joi.number().default(60),
  THROTTLE_LIMIT: Joi.number().default(10),
  
  // OAuth validation (optional in development)
  OAUTH_GOOGLE_CLIENT_ID: Joi.string().optional(),
  OAUTH_GOOGLE_CLIENT_SECRET: Joi.string().optional(),
  OAUTH_GOOGLE_CALLBACK_URL: Joi.string().optional(),
  
  // Biometric authentication
  BIOMETRIC_KEY_MAX_AGE: Joi.number().default(30),
  
  // Redis validation
  REDIS_HOST: Joi.string().default('localhost'),
  REDIS_PORT: Joi.number().default(6379),
  REDIS_PASSWORD: Joi.string().optional(),
  
  // Microservices URLs validation
  PSP_SERVICE_URL: Joi.string().default('http://psp-service:3003'),
  BANK_SOURCE_SERVICE_URL: Joi.string().default('http://bank-source-service:3001'),
  BANK_DESTINATION_SERVICE_URL: Joi.string().default('http://bank-destination-service:3002'),
  SHAPARAK_SERVICE_URL: Joi.string().default('http://shaparak-service:3005'),
  SHETAB_SERVICE_URL: Joi.string().default('http://shetab-service:3004'),
  HUB_SHAPARAK_SERVICE_URL: Joi.string().default('http://hub-shaparak-service:3006'),
});