import { LoggerService } from '@nestjs/common';
import * as winston from 'winston';
import * as DailyRotateFile from 'winston-daily-rotate-file';

// Custom logger class that can be used throughout the application
export class Logger implements LoggerService {
  private static instance: Logger;
  private logger: winston.Logger;

  private constructor() {
    // Define log format
    const logFormat = winston.format.combine(
      winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
      winston.format.errors({ stack: true }),
      winston.format.splat(),
      winston.format.json(),
    );

    // Create daily rotate transport for file
    const fileTransport = new DailyRotateFile({
      filename: 'logs/hub-shaparak-%DATE%.log',
      datePattern: 'YYYY-MM-DD',
      zippedArchive: true,
      maxSize: '20m',
      maxFiles: '14d',
      format: logFormat,
    });

    // Create transport for error logs
    const errorTransport = new DailyRotateFile({
      filename: 'logs/hub-shaparak-error-%DATE%.log',
      datePattern: 'YYYY-MM-DD',
      zippedArchive: true,
      maxSize: '20m',
      maxFiles: '14d',
      level: 'error',
      format: logFormat,
    });

    // Console transport for development
    const consoleTransport = new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
        winston.format.printf(
          (info) => `${info.timestamp} ${info.level}: ${info.message}${info.stack ? '\n' + info.stack : ''}`,
        ),
      ),
    });

    // Initialize logger with transports
    this.logger = winston.createLogger({
      level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
      defaultMeta: { service: 'hub-shaparak' },
      transports: [
        consoleTransport,
        fileTransport,
        errorTransport,
      ],
      exitOnError: false,
    });
  }

  // Get or create logger instance (Singleton pattern)
  private static getInstance(): Logger {
    if (!Logger.instance) {
      Logger.instance = new Logger();
    }
    return Logger.instance;
  }

  // Log methods
  static log(message: string, context?: string): void {
    this.getInstance().logger.info(message, { context });
  }

  static error(message: string, trace?: string, context?: string): void {
    this.getInstance().logger.error(message, { trace, context });
  }

  static warn(message: string, context?: string): void {
    this.getInstance().logger.warn(message, { context });
  }

  static debug(message: string, context?: string): void {
    this.getInstance().logger.debug(message, { context });
  }

  static verbose(message: string, context?: string): void {
    this.getInstance().logger.verbose(message, { context });
  }

  // Required methods for NestJS LoggerService
  log(message: any, context?: string): void {
    Logger.log(message, context);
  }

  error(message: any, trace?: string, context?: string): void {
    Logger.error(message, trace, context);
  }

  warn(message: any, context?: string): void {
    Logger.warn(message, context);
  }

  debug(message: any, context?: string): void {
    Logger.debug(message, context);
  }

  verbose(message: any, context?: string): void {
    Logger.verbose(message, context);
  }

  // Method to log transaction details
  static logTransaction(transactionId: string, action: string, data: any): void {
    this.getInstance().logger.info(`Transaction ${action}`, {
      transactionId,
      action,
      data,
    });
  }

  // Method to log security events
  static logSecurity(event: string, details: any): void {
    this.getInstance().logger.warn(`Security event: ${event}`, {
      securityEvent: event,
      details,
    });
  }

  // Method to log performance metrics
  static logPerformance(operation: string, durationMs: number, metadata?: any): void {
    this.getInstance().logger.info(`Performance: ${operation}`, {
      performance: true,
      operation,
      durationMs,
      ...metadata,
    });
  }
}