import { Request, Response } from 'express';
import { inject, injectable } from 'inversify';
import { Logger } from '../utils/Logger';
import { ReviewFilters } from '../database/repositories/ReviewRepository';
import { ReviewCategories, ReviewChannel } from '../database/models/Review';

@injectable()
export abstract class BaseController {
  constructor(@inject('Logger') protected logger: Logger) {}

  protected sendSuccess<T>(
    res: Response,
    data: T,
    message?: string,
    statusCode: number = 200
  ): void {
    res.status(statusCode).json({
      success: true,
      message,
      data,
      timestamp: new Date().toISOString()
    });
  }

  protected sendError(
    res: Response,
    message: string,
    statusCode: number = 400,
    code?: string
  ): void {
    res.status(statusCode).json({
      success: false,
      error: {
        message,
        code: code || 'ERROR'
      },
      timestamp: new Date().toISOString()
    });
  }

  protected extractPagination(req: Request) {
    return {
      limit: Math.min(parseInt(req.query['limit'] as string) || 50, 100),
      offset: parseInt(req.query['offset'] as string) || 0,
      sortBy: (req.query['sortBy'] as string) || 'date',
      sortOrder: (req.query['sortOrder'] as 'asc' | 'desc') || 'desc'
    };
  }

  protected extractFilters(req: Request): Partial<ReviewFilters> {
  const filters: Partial<ReviewFilters> = {};
  
  if (req.query['property']) filters.propertyName = req.query['property'] as string;
  if (req.query['rating']) filters.minRating = parseFloat(req.query['rating'] as string);
  if (req.query['category']) {
    filters.category = req.query['category'] as keyof ReviewCategories;
  }
  if (req.query['channel']) {
    filters.channel = req.query['channel'] as ReviewChannel;
  }
  if (req.query['timeFrom']) filters.timeFrom = new Date(req.query['timeFrom'] as string);
  if (req.query['timeTo']) filters.timeTo = new Date(req.query['timeTo'] as string);
  if (req.query['approved'] !== undefined) {
    filters.isApprovedForPublic = req.query['approved'] === 'true';
  }
  
  return filters;
}
  protected getRequestContext(req: Request) {
    return {
      requestId: req.headers['x-request-id'] as string,
      userAgent: req.get('User-Agent'),
      ip: req.ip,
      method: req.method,
      path: req.path
    };
  }
}