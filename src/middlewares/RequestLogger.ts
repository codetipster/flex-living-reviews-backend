import { Request, Response, NextFunction } from 'express';
import { Logger } from '../utils/Logger';
import { inject, injectable } from 'inversify';

@injectable()
export class RequestLogger {
  constructor(@inject('Logger') private logger: Logger) {}

  log = (req: Request, res: Response, next: NextFunction): void => {
    const startTime = Date.now();
    const requestId = this.generateRequestId();
    
    // Add request ID to headers for tracing
    req.headers['x-request-id'] = requestId;
    res.setHeader('X-Request-ID', requestId);

    // Store logger and request info for response handler
    (res as any)._requestLogger = {
      logger: this.logger,
      requestId,
      startTime,
      method: req.method,
      path: req.path
    };

    // Log request start
    this.logger.info('Request started', {
      requestId,
      method: req.method,
      path: req.path,
      query: req.query,
      userAgent: req.get('User-Agent'),
      ip: req.ip
    });

    // instead of overriding res.end
    res.on('finish', () => {
      const loggerData = (res as any)._requestLogger;
      if (loggerData) {
        const duration = Date.now() - loggerData.startTime;
        
        loggerData.logger.info('Request completed', {
          requestId: loggerData.requestId,
          method: loggerData.method,
          path: loggerData.path,
          statusCode: res.statusCode,
          duration,
          contentLength: res.get('Content-Length') || 0
        });
      }
    });

    next();
  };

  private generateRequestId(): string {
    return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}