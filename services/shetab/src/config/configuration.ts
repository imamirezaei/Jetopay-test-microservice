// config/configuration.ts
export const configuration = () => ({
    NODE_ENV: process.env.NODE_ENV || 'development',
    PORT: parseInt(process.env.PORT || '3004', 10),
    
    // Database
    DB_HOST: process.env.DB_HOST || 'localhost',
    DB_PORT: parseInt(process.env.DB_PORT || '5432', 10),
    DB_USERNAME: process.env.DB_USERNAME || 'postgres',
    DB_PASSWORD: process.env.DB_PASSWORD || 'postgres',
    DB_DATABASE: process.env.DB_DATABASE || 'jetopay_shetab',
    DB_SYNC: process.env.DB_SYNC === 'true',
    DB_SSL: process.env.DB_SSL === 'true',
    DB_LOGGING: process.env.DB_LOGGING === 'true',
    
    // RabbitMQ
    RABBITMQ_URL: process.env.RABBITMQ_URL || 'amqp://localhost:5672',
    
    // Shetab Network Configuration
    SHETAB_API_URL: process.env.SHETAB_API_URL || 'https://api.shetab.ir',
    SHETAB_API_KEY: process.env.SHETAB_API_KEY,
    SHETAB_API_SECRET: process.env.SHETAB_API_SECRET,
    
    // Transaction Fees
    INTERBANK_BASE_FEE: parseInt(process.env.INTERBANK_BASE_FEE || '10000', 10), // 10,000 IRR
    MAX_FEE_CAP: parseInt(process.env.MAX_FEE_CAP || '100000', 10), // 100,000 IRR
    FEE_PERCENTAGE: parseFloat(process.env.FEE_PERCENTAGE || '0.001'), // 0.1%
    
    // Settlement Configuration
    SETTLEMENT_BATCH_SIZE: parseInt(process.env.SETTLEMENT_BATCH_SIZE || '1000', 10),
    SETTLEMENT_TIME: process.env.SETTLEMENT_TIME || '23:30', // Time for daily settlement batch
    SETTLEMENT_RETRY_COUNT: parseInt(process.env.SETTLEMENT_RETRY_COUNT || '3', 10),
    
    // Timeouts and Limits
    TRANSACTION_TIMEOUT_SECONDS: parseInt(process.env.TRANSACTION_TIMEOUT_SECONDS || '60', 10),
    MAX_RETRIES: parseInt(process.env.MAX_RETRIES || '3', 10),
    MAX_TRANSACTION_AMOUNT: parseInt(process.env.MAX_TRANSACTION_AMOUNT || '1000000000', 10), // 1B IRR
  });
  