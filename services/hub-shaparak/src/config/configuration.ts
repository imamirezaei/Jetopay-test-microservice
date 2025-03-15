// config/configuration.ts
export const configuration = () => ({
    NODE_ENV: process.env.NODE_ENV || 'development',
    PORT: parseInt(process.env.PORT || '3006', 10),
    
    // Database
    DB_HOST: process.env.DB_HOST || 'localhost',
    DB_PORT: parseInt(process.env.DB_PORT || '5432', 10),
    DB_USERNAME: process.env.DB_USERNAME || 'postgres',
    DB_PASSWORD: process.env.DB_PASSWORD || 'postgres',
    DB_DATABASE: process.env.DB_DATABASE || 'jetopay_hub_shaparak',
    DB_SYNC: process.env.DB_SYNC === 'true',
    DB_SSL: process.env.DB_SSL === 'true',
    DB_LOGGING: process.env.DB_LOGGING === 'true',
    
    // RabbitMQ
    RABBITMQ_URL: process.env.RABBITMQ_URL || 'amqp://localhost:5672',
    
    // CORS
    CORS_ORIGIN: process.env.CORS_ORIGIN || '*',
    
    // Rate limiting
    THROTTLE_TTL: parseInt(process.env.THROTTLE_TTL || '60', 10),
    THROTTLE_LIMIT: parseInt(process.env.THROTTLE_LIMIT || '10', 10),
    
    // Transaction settings
    TRANSACTION_TIMEOUT_MS: parseInt(process.env.TRANSACTION_TIMEOUT_MS || '30000', 10),
    MAX_RETRY_ATTEMPTS: parseInt(process.env.MAX_RETRY_ATTEMPTS || '3', 10),
    
    // CBI (Central Bank of Iran) settings
    CBI_API_URL: process.env.CBI_API_URL || 'https://api.cbi.ir',
    CBI_API_KEY: process.env.CBI_API_KEY,
    
    // Shaparak settings
    SHAPARAK_API_URL: process.env.SHAPARAK_API_URL || 'https://api.shaparak.ir',
    SHAPARAK_MERCHANT_ID: process.env.SHAPARAK_MERCHANT_ID,
    SHAPARAK_TERMINAL_ID: process.env.SHAPARAK_TERMINAL_ID,
    
    // Redis cache
    REDIS_HOST: process.env.REDIS_HOST || 'localhost',
    REDIS_PORT: parseInt(process.env.REDIS_PORT || '6379', 10),
    REDIS_PASSWORD: process.env.REDIS_PASSWORD,
  });
  