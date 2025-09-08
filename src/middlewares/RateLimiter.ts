import { Request, Response } from 'express';
import rateLimit from 'express-rate-limit';
import { AppError } from '../utils/errors/AppError';

export const createRateLimiter = (windowMs: number, max: number, message?: string) => {
  return rateLimit({
    windowMs,
    max,
    message: {
      success: false,
      error: {
        message: message || 'Too many requests, please try again later',
        code: 'RATE_LIMIT_EXCEEDED'
      }
    },
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req: Request, _res: Response) => {
      throw AppError.validation('Rate limit exceeded', {
        limit: max,
        windowMs,
        ip: req.ip
      });
    }
  });
};

// Different rate limits for different endpoints
export const publicApiLimiter = createRateLimiter(15 * 60 * 1000, 100); // 100 requests per 15 minutes
export const managerApiLimiter = createRateLimiter(15 * 60 * 1000, 300); // 300 requests per 15 minutes
export const syncApiLimiter = createRateLimiter(60 * 60 * 1000, 10); // 10 sync requests per hour