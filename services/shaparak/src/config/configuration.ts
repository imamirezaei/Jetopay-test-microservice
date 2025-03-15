// config/configuration.ts
export const configuration = () => ({
    NODE_ENV: process.env.NODE_ENV || 'development',
    PORT: parseInt(process.env.PORT || '3005', 10),
    
    // Database
    DB_HOST: process.env.DB_HOST || 'localhost',
    DB_PORT: parseInt(process.env.DB_PORT || '5432', 10),
    DB_USERNAME: process.env.DB_USERNAME || 'postgres',
    DB_PASSWORD: process.env.DB_PASSWORD || 'postgres',
    DB_DATABASE: process.env.DB_DATABASE || 'jetopay_shaparak',
    DB_SYNC: process.env.DB_SYNC === 'true',
    DB_SSL: process.env.DB_SSL === 'true',
    DB_LOGGING: process.env.DB_LOGGING === 'true',
    
    // RabbitMQ
    RABBITMQ_URL: process.env.RABBITMQ_URL || 'amqp://localhost:5672',
    
    // JWT
    JWT_SECRET: process.env.JWT_SECRET || 'secret-key',
    
    // CORS
    CORS_ORIGIN: process.env.CORS_ORIGIN || '*',
    
    // Shaparak Configuration
    SHAPARAK_GATEWAY_URL: process.env.SHAPARAK_GATEWAY_URL || 'https://shaparak.ir/payment/gateway',
    SHAPARAK_CALLBACK_URL: process.env.SHAPARAK_CALLBACK_URL || 'https://api.jetopay.com/shaparak/payments/callback',
    
    // Encryption
    ENCRYPTION_KEY: process.env.ENCRYPTION_KEY || 'your-secure-encryption-key-min-32-chars',
    
    // Microservices URLs
    SHETAB_SERVICE_URL: process.env.SHETAB_SERVICE_URL || 'http://shetab-service:3004',
    HUB_SHAPARAK_SERVICE_URL: process.env.HUB_SHAPARAK_SERVICE_URL || 'http://hub-shaparak-service:3006',
  });
  