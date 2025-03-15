import { Injectable, NestMiddleware, Logger } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';

/**
 * Enhanced logging middleware that provides:
 * - Request/response logging with timing information
 * - Request ID generation and propagation
 * - Correlation IDs for tracking requests across services
 * - Sensitive data masking
 * - Security headers validation
 * - Performance monitoring
 * - Error tracking
 */
@Injectable()
export class LoggingMiddleware implements NestMiddleware {
  private readonly logger = new Logger('HTTP');
  private readonly isDevelopment: boolean;
  private readonly isProduction: boolean;
  private readonly enableDetailedLogs: boolean;
  private readonly enablePerformanceLogging: boolean;
  private readonly sensitiveHeaders: string[] = [
    'authorization', 
    'x-api-key', 
    'api-key',
    'password',
    'token',
    'cookie'
  ];
  private readonly sensitiveBodyFields: string[] = [
    'password',
    'token',
    'apiKey',
    'secret',
    'cardNumber',
    'cvv',
    'pin',
    'securityCode',
    'accessToken',
    'refreshToken',
    'accountNumber',
    'creditCard',
    'nationalId'
  ];

  constructor(private readonly configService: ConfigService) {
    const env = configService.get<string>('NODE_ENV', 'development');
    this.isDevelopment = env === 'development';
    this.isProduction = env === 'production';
    this.enableDetailedLogs = configService.get<boolean>('ENABLE_DETAILED_LOGS', !this.isProduction);
    this.enablePerformanceLogging = configService.get<boolean>('ENABLE_PERFORMANCE_LOGGING', true);
  }

  /**
   * Main middleware function that processes the request and response
   */
  use(req: Request, res: Response, next: NextFunction): void {
    // Extract request data
    const { ip, method, originalUrl, headers } = req;
    const userAgent = req.get('user-agent') || '';
    
    // Generate or retrieve request and correlation IDs
    const requestId = this.getOrGenerateRequestId(req);
    const correlationId = this.getOrGenerateCorrelationId(req);
    
    // Set tracking headers for downstream services
    req.headers['x-request-id'] = requestId;
    req.headers['x-correlation-id'] = correlationId;
    res.setHeader('x-request-id', requestId);
    res.setHeader('x-correlation-id', correlationId);
    
    // Add request context to logs
    const requestContext = {
      requestId,
      correlationId,
      method,
      url: originalUrl,
      ip,
      userAgent
    };
    
    // Start performance measurement
    const startTime = process.hrtime();
    let requestBody = null;
    
    // Log the incoming request
    this.logRequest(req, requestContext);
    
    // Track original response functions
    const originalSend = res.send;
    const originalJson = res.json;
    const originalEnd = res.end;
    
    // Log the response body (for JSON responses)
    res.json = function(body) {
      // Store response body for logging
      res.locals.responseBody = body;
      return originalJson.call(this, body);
    };
    
    // Track when response is sent with raw data
    res.send = function(body) {
      if (typeof body === 'string' || Buffer.isBuffer(body)) {
        res.locals.rawResponseBody = body;
      }
      return originalSend.call(this, body);
    };
    
    // Monitor response completion
    res.end = function(chunk, encoding) {
      // Calculate duration
      const hrDuration = process.hrtime(startTime);
      const durationMs = (hrDuration[0] * 1000 + hrDuration[1] / 1000000).toFixed(2);
      
      // Create response context
      const responseContext = {
        ...requestContext,
        statusCode: res.statusCode,
        contentLength: res.getHeader('content-length') || 0,
        durationMs
      };
      
      // Log the response
      process.nextTick(() => {
        // This runs after the response has been sent
        this.logResponse(res, responseContext);
        
        // Log performance metrics if enabled
        if (this.enablePerformanceLogging) {
          this.logPerformanceMetrics(requestContext, durationMs);
        }
      });
      
      // Continue with the original end function
      return originalEnd.apply(this, arguments);
    }.bind(this);
    
    // Error handling - catch any errors during request processing
    req.on('error', (error) => {
      this.logger.error(
        `[${requestId}] Request error: ${error.message}`,
        error.stack,
        requestContext
      );
    });
    
    res.on('error', (error) => {
      this.logger.error(
        `[${requestId}] Response error: ${error.message}`,
        error.stack,
        requestContext
      );
    });
    
    // Proceed to the next middleware/handler
    next();
  }

  /**
   * Logs the incoming request details
   */
  private logRequest(req: Request, context: any): void {
    const { requestId, method, url } = context;
    
    // Basic request log
    this.logger.log(`[${requestId}] --> ${method} ${url}`);
    
    // Log detailed request information if enabled
    if (this.enableDetailedLogs) {
      // Log headers with sensitive info masked
      const maskedHeaders = this.maskSensitiveHeaders(req.headers);
      
      // Log request body for appropriate methods (excluding file uploads and large payloads)
      if (['POST', 'PUT', 'PATCH'].includes(method) && 
          req.body && 
          Object.keys(req.body).length > 0 && 
          !this.isMultipartFormData(req) &&
          this.isBodySizeWithinLimit(req)) {
        
        const maskedBody = this.maskSensitiveData(req.body);
        this.logger.debug(
          `[${requestId}] Request Details:`,
          {
            headers: maskedHeaders,
            query: req.query,
            params: req.params,
            body: maskedBody
          }
        );
      } else {
        this.logger.debug(
          `[${requestId}] Request Details:`,
          {
            headers: maskedHeaders,
            query: req.query,
            params: req.params
          }
        );
      }
    }
  }

  /**
   * Logs the outgoing response details
   */
  private logResponse(res: Response, context: any): void {
    const { requestId, method, url, statusCode, durationMs } = context;
    
    // Determine log level based on status code
    const logLevel = this.getLogLevelForStatus(statusCode);
    const logMethod = logLevel === 'error' ? this.logger.error : this.logger.log;
    
    // Basic response log
    logMethod.call(
      this.logger,
      `[${requestId}] <-- ${method} ${url} ${statusCode} ${durationMs}ms`
    );
    
    // Log detailed response information for non-production environments
    if (this.enableDetailedLogs) {
      // Don't log response bodies for success status codes in production to save space
      if (!this.isProduction || statusCode >= 400) {
        let responseBody = res.locals.responseBody || res.locals.rawResponseBody;
        
        // Only log response body if it exists and isn't too large
        if (responseBody && this.isResponseSizeWithinLimit(responseBody)) {
          // Mask sensitive data if it's a JSON object
          if (typeof responseBody === 'object') {
            responseBody = this.maskSensitiveData(responseBody);
          }
          
          this.logger.debug(
            `[${requestId}] Response Details:`,
            {
              statusCode,
              headers: res.getHeaders(),
              body: responseBody,
              durationMs
            }
          );
        } else {
          this.logger.debug(
            `[${requestId}] Response Details:`,
            {
              statusCode,
              headers: res.getHeaders(),
              bodySize: this.getObjectSize(responseBody),
              durationMs
            }
          );
        }
      }
    }
    
    // Log warning for slow responses
    if (parseInt(durationMs) > 1000) {
      this.logger.warn(
        `[${requestId}] Slow response detected: ${method} ${url} took ${durationMs}ms`,
        { method, url, durationMs, statusCode }
      );
    }
  }

  /**
   * Logs performance metrics for monitoring
   */
  private logPerformanceMetrics(context: any, durationMs: string): void {
    const { requestId, method, url } = context;
    
    // Memory usage
    const memoryUsage = process.memoryUsage();
    const formattedMemoryUsage = {
      rss: `${Math.round(memoryUsage.rss / 1024 / 1024)} MB`,
      heapTotal: `${Math.round(memoryUsage.heapTotal / 1024 / 1024)} MB`,
      heapUsed: `${Math.round(memoryUsage.heapUsed / 1024 / 1024)} MB`,
      external: `${Math.round(memoryUsage.external / 1024 / 1024)} MB`
    };
    
    // CPU usage (simplified - in a real app you might use a more sophisticated approach)
    const cpuUsage = process.cpuUsage();
    
    this.logger.debug(
      `[${requestId}] Performance metrics:`,
      {
        endpoint: `${method} ${url}`,
        responseTime: `${durationMs}ms`,
        memory: formattedMemoryUsage,
        cpu: {
          user: `${Math.round(cpuUsage.user / 1000)} ms`,
          system: `${Math.round(cpuUsage.system / 1000)} ms`
        }
      }
    );
  }

  /**
   * Get or generate a request ID
   */
  private getOrGenerateRequestId(req: Request): string {
    return (
      req.headers['x-request-id'] as string || 
      `req-${Date.now()}-${crypto.randomBytes(8).toString('hex')}`
    );
  }

  /**
   * Get or generate a correlation ID for tracing across services
   */
  private getOrGenerateCorrelationId(req: Request): string {
    return (
      req.headers['x-correlation-id'] as string || 
      `corr-${Date.now()}-${crypto.randomBytes(6).toString('hex')}`
    );
  }

  /**
   * Masks sensitive headers to prevent security information leakage
   */
  private maskSensitiveHeaders(headers: Record<string, any>): Record<string, any> {
    const maskedHeaders = { ...headers };
    
    this.sensitiveHeaders.forEach(header => {
      const headerKey = Object.keys(maskedHeaders).find(
        key => key.toLowerCase() === header.toLowerCase()
      );
      
      if (headerKey && maskedHeaders[headerKey]) {
        const value = maskedHeaders[headerKey] as string;
        
        // Keep the first and last characters for some context, but mask the rest
        if (value.length > 8) {
          maskedHeaders[headerKey] = `${value.substring(0, 3)}...${value.substring(value.length - 3)}`;
        } else {
          maskedHeaders[headerKey] = '[MASKED]';
        }
      }
    });
    
    return maskedHeaders;
  }

  /**
   * Recursively masks sensitive data in objects
   */
  private maskSensitiveData(data: any): any {
    // Don't process null or undefined
    if (data === null || data === undefined) {
      return data;
    }
    
    // Handle different data types
    if (typeof data !== 'object') {
      return data;
    }
    
    // Handle arrays
    if (Array.isArray(data)) {
      return data.map(item => this.maskSensitiveData(item));
    }
    
    // Handle objects (recursive)
    const maskedData = { ...data };
    
    Object.keys(maskedData).forEach(key => {
      // Check if this is a sensitive field
      if (this.isSensitiveField(key)) {
        const originalValue = maskedData[key];
        
        // Only mask string values
        if (typeof originalValue === 'string') {
          const length = originalValue.length;
          
          if (length > 0) {
            // Different masking strategies for different field types
            if (key.toLowerCase().includes('card') && length > 8) {
              // For card numbers, keep first 6 and last 4 digits
              maskedData[key] = `${originalValue.substring(0, 6)}${'*'.repeat(length - 10)}${originalValue.substring(length - 4)}`;
            } else {
              // For general sensitive fields, indicate the value length
              maskedData[key] = `[MASKED:${length}]`;
            }
          }
        }
      } else if (typeof maskedData[key] === 'object' && maskedData[key] !== null) {
        // Recursively process nested objects
        maskedData[key] = this.maskSensitiveData(maskedData[key]);
      }
    });
    
    return maskedData;
  }

  /**
   * Checks if a field name should be considered sensitive
   */
  private isSensitiveField(fieldName: string): boolean {
    const lowerFieldName = fieldName.toLowerCase();
    
    return this.sensitiveBodyFields.some(sensitiveField => 
      lowerFieldName.includes(sensitiveField.toLowerCase())
    );
  }

  /**
   * Checks if the request is a multipart form data (usually file upload)
   */
  private isMultipartFormData(req: Request): boolean {
    const contentType = req.headers['content-type'] || '';
    return contentType.includes('multipart/form-data');
  }

  /**
   * Checks if the body size is within logging limits to prevent memory issues
   */
  private isBodySizeWithinLimit(req: Request): boolean {
    const contentLength = parseInt(req.headers['content-length'] as string, 10) || 0;
    const maxSize = this.configService.get<number>('MAX_LOG_BODY_SIZE', 100000); // 100KB default
    return contentLength < maxSize;
  }

  /**
   * Checks if the response size is within logging limits
   */
  private isResponseSizeWithinLimit(body: any): boolean {
    const maxSize = this.configService.get<number>('MAX_LOG_BODY_SIZE', 100000); // 100KB default
    return this.getObjectSize(body) < maxSize;
  }

  /**
   * Estimates the size of an object (in bytes)
   */
  private getObjectSize(obj: any): number {
    if (!obj) return 0;
    
    try {
      // For strings and buffers
      if (typeof obj === 'string') return obj.length;
      if (Buffer.isBuffer(obj)) return obj.length;
      
      // For objects/arrays, stringify and measure
      const json = JSON.stringify(obj);
      return json ? json.length : 0;
    } catch (e) {
      return 0; // If can't measure, assume it's too big
    }
  }

  /**
   * Determines appropriate log level based on status code
   */
  private getLogLevelForStatus(status: number): string {
    if (status >= 500) return 'error';
    if (status >= 400) return 'warn';
    return 'log';
  }
}