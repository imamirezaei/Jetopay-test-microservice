// config/configuration.ts
export const configuration = () => ({
    NODE_ENV: process.env.NODE_ENV || 'development',
    PORT: parseInt(process.env.PORT || '3007', 10),
    
    // Database
    DB_HOST: process.env.DB_HOST || 'localhost',
    DB_PORT: parseInt(process.env.DB_PORT || '5432', 10),
    DB_USERNAME: process.env.DB_USERNAME || 'postgres',
    DB_PASSWORD: process.env.DB_PASSWORD || 'postgres',
    DB_DATABASE: process.env.DB_DATABASE || 'jetopay_gateway',
    DB_SYNC: process.env.DB_SYNC === 'true',
    DB_SSL: process.env.DB_SSL === 'true',
    DB_LOGGING: process.env.DB_LOGGING === 'true',
    
    // RabbitMQ
    RABBITMQ_URL: process.env.RABBITMQ_URL || 'amqp://localhost:5672',
    
    // JWT
    JWT_SECRET: process.env.JWT_SECRET || 'secret-key',
    JWT_ACCESS_EXPIRATION: process.env.JWT_ACCESS_EXPIRATION || '15m',
    JWT_REFRESH_EXPIRATION: process.env.JWT_REFRESH_EXPIRATION || '7d',
    
    // CORS
    CORS_ORIGIN: process.env.CORS_ORIGIN || '*',
    
    // Rate limiting
    THROTTLE_TTL: parseInt(process.env.THROTTLE_TTL || '60', 10),
    THROTTLE_LIMIT: parseInt(process.env.THROTTLE_LIMIT || '10', 10),
    
    // OAuth
    OAUTH_GOOGLE_CLIENT_ID: process.env.OAUTH_GOOGLE_CLIENT_ID,
    OAUTH_GOOGLE_CLIENT_SECRET: process.env.OAUTH_GOOGLE_CLIENT_SECRET,
    OAUTH_GOOGLE_CALLBACK_URL: process.env.OAUTH_GOOGLE_CALLBACK_URL,
    
    // Biometric authentication
    BIOMETRIC_KEY_MAX_AGE: parseInt(process.env.BIOMETRIC_KEY_MAX_AGE || '30', 10), // days
    
    // Redis
    REDIS_HOST: process.env.REDIS_HOST || 'localhost',
    REDIS_PORT: parseInt(process.env.REDIS_PORT || '6379', 10),
    REDIS_PASSWORD: process.env.REDIS_PASSWORD,
    
    // Microservices URLs
    PSP_SERVICE_URL: process.env.PSP_SERVICE_URL || 'http://psp-service:3003',
    BANK_SOURCE_SERVICE_URL: process.env.BANK_SOURCE_SERVICE_URL || 'http://bank-source-service:3001',
    BANK_DESTINATION_SERVICE_URL: process.env.BANK_DESTINATION_SERVICE_URL || 'http://bank-destination-service:3002',
    SHAPARAK_SERVICE_URL: process.env.SHAPARAK_SERVICE_URL || 'http://shaparak-service:3005',
    SHETAB_SERVICE_URL: process.env.SHETAB_SERVICE_URL || 'http://shetab-service:3004',
    HUB_SHAPARAK_SERVICE_URL: process.env.HUB_SHAPARAK_SERVICE_URL || 'http://hub-shaparak-service:3006',
  });
  
  