// config/validation.ts
import * as Joi from 'joi';

export const validationSchema = Joi.object({
  NODE_ENV: Joi.string().valid('development', 'production', 'test').default('development'),
  PORT: Joi.number().default(3005),
  
  // Database validation
  DB_HOST: Joi.string().default('localhost'),
  DB_PORT: Joi.number().default(5432),
  DB_USERNAME: Joi.string().default('postgres'),
  DB_PASSWORD: Joi.string().default('postgres'),
  DB_DATABASE: Joi.string().default('jetopay_shaparak'),
  DB_SYNC: Joi.boolean().default(false),
  DB_SSL: Joi.boolean().default(false),
  DB_LOGGING: Joi.boolean().default(false),
  
  // RabbitMQ validation
  RABBITMQ_URL: Joi.string().default('amqp://localhost:5672'),
  
  // JWT validation
  JWT_SECRET: Joi.string().required(),
  
  // CORS validation
  CORS_ORIGIN: Joi.string().default('*'),
  
  // Shaparak Configuration validation
  SHAPARAK_GATEWAY_URL: Joi.string().default('https://shaparak.ir/payment/gateway'),
  SHAPARAK_CALLBACK_URL: Joi.string().default('https://api.jetopay.com/shaparak/payments/callback'),
  
  // Encryption validation
  ENCRYPTION_KEY: Joi.string().min(32).required(),
  
  // Microservices URLs validation
  SHETAB_SERVICE_URL: Joi.string().default('http://shetab-service:3004'),
  HUB_SHAPARAK_SERVICE_URL: Joi.string().default('http://hub-shaparak-service:3006'),
});