import { Request, Response, NextFunction } from 'express';
import { AppError } from '../utils/errors/AppError';
import { Logger } from '../utils/Logger';
import { inject, injectable } from 'inversify';

@injectable()
export class ErrorHandler {
  constructor(@inject('Logger') private logger: Logger) {}

  handle = (error: Error, req: Request, res: Response, _next: NextFunction): void => {
    const requestId = req.headers['x-request-id'] as string || 'unknown';
    
    // Log the error with context
    this.logger.error('Request error occurred', error, {
      requestId,
      method: req.method,
      path: req.path,
      query: req.query,
      body: this.sanitizeBody(req.body),
      userAgent: req.get('User-Agent'),
      ip: req.ip
    });

    // Handle known application errors
    if (error instanceof AppError) {
      res.status(error.statusCode).json({
        success: false,
        error: {
          message: error.message,
          code: error.code,
          ...(process.env['NODE_ENV'] === 'development' && error.context ? { context: error.context } : {})
        },
        requestId
      });
      return;
    }

    // Handle validation errors from express-validator
    if (error.name === 'ValidationError') {
      res.status(400).json({
        success: false,
        error: {
          message: 'Validation failed',
          code: 'VALIDATION_ERROR',
          details: error.message
        },
        requestId
      });
      return;
    }

    // Handle Axios errors (external API calls)
    if (error.name === 'AxiosError') {
      const axiosError = error as any;
      res.status(502).json({
        success: false,
        error: {
          message: 'External service error',
          code: 'EXTERNAL_SERVICE_ERROR',
          ...(process.env['NODE_ENV'] === 'development' && {
            details: axiosError.response?.data || axiosError.message
          })
        },
        requestId
      });
      return;
    }

    // Handle unexpected errors
    res.status(500).json({
      success: false,
      error: {
        message: process.env['NODE_ENV'] === 'production' 
          ? 'An unexpected error occurred' 
          : error.message,
        code: 'INTERNAL_SERVER_ERROR'
      },
      requestId
    });
  };

  private sanitizeBody(body: any): any {
    if (!body) return body;
    
    const sensitiveFields = ['password', 'token', 'apiKey', 'secret'];
    const sanitized = { ...body };
    
    sensitiveFields.forEach(field => {
      if (sanitized[field]) {
        sanitized[field] = '[REDACTED]';
      }
    });
    
    return sanitized;
  }
}