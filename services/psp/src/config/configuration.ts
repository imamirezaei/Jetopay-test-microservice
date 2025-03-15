// src/config/configuration.ts
export const configuration = () => ({
    // Application
    NODE_ENV: process.env.NODE_ENV || 'development',
    PORT: parseInt(process.env.PORT || '3003', 10),
    
    // Database
    DB_HOST: process.env.DB_HOST || 'localhost',
    DB_PORT: parseInt(process.env.DB_PORT || '5432', 10),
    DB_USERNAME: process.env.DB_USERNAME || 'postgres',
    DB_PASSWORD: process.env.DB_PASSWORD || 'postgres',
    DB_DATABASE: process.env.DB_DATABASE || 'jetopay_psp',
    DB_SYNC: process.env.DB_SYNC === 'true',
    DB_LOGGING: process.env.DB_LOGGING === 'true',
    
    // RabbitMQ
    RABBITMQ_URL: process.env.RABBITMQ_URL || 'amqp://localhost:5672',
    
    // PSP Integration
    SHAPARAK_API_KEY: process.env.SHAPARAK_API_KEY,
    SHAPARAK_API_URL: process.env.SHAPARAK_API_URL || 'https://api.shaparak.ir/v1',
    SHETAB_API_KEY: process.env.SHETAB_API_KEY,
    SHETAB_API_URL: process.env.SHETAB_API_URL || 'https://api.shetab.ir/v1',
    
    // CORS
    CORS_ORIGIN: process.env.CORS_ORIGIN || '*',
    
    // API Rate limiting
    THROTTLE_TTL: parseInt(process.env.THROTTLE_TTL || '60', 10),
    THROTTLE_LIMIT: parseInt(process.env.THROTTLE_LIMIT || '20', 10),
    
    // Redis (for caching)
    REDIS_HOST: process.env.REDIS_HOST || 'localhost',
    REDIS_PORT: parseInt(process.env.REDIS_PORT || '6379', 10),
    REDIS_PASSWORD: process.env.REDIS_PASSWORD || null,
    
    // Transaction settings
    TRANSACTION_TIMEOUT_SECONDS: parseInt(process.env.TRANSACTION_TIMEOUT_SECONDS || '900', 10), // 15 minutes
    MAX_PAYMENT_ATTEMPTS: parseInt(process.env.MAX_PAYMENT_ATTEMPTS || '3', 10),
    
    // Fraud detection
    FRAUD_DETECTION_ENABLED: process.env.FRAUD_DETECTION_ENABLED !== 'false',
    HIGH_AMOUNT_THRESHOLD: parseInt(process.env.HIGH_AMOUNT_THRESHOLD || '100000000', 10), // 100M IRR
    MAX_DAILY_TRANSACTIONS: parseInt(process.env.MAX_DAILY_TRANSACTIONS || '20', 10),
    
    // Logging
    LOG_LEVEL: process.env.LOG_LEVEL || 'info',
    LOG_FILE_PATH: process.env.LOG_FILE_PATH || 'logs/psp-service.log',
    
    // Metrics
    METRICS_ENABLED: process.env.METRICS_ENABLED === 'true',
    METRICS_PORT: parseInt(process.env.METRICS_PORT || '9464', 10),
  });