import { Request, Response } from 'express';
import { inject, injectable } from 'inversify';
import { BaseController } from './BaseController';
import { IReviewService } from '../services/interfaces/IReviewService';
import { Logger } from '../utils/Logger';
// import { AppError } from '../utils/errors/AppError';

@injectable()
export class ReviewController extends BaseController {
  constructor(
    @inject('Logger') logger: Logger,
    @inject('ReviewService') private reviewService: IReviewService
  ) {
    super(logger);
  }

  // GET /api/reviews/hostaway
  public getHostawayReviews = async (req: Request, res: Response): Promise<void> => {
    try {
      const context = this.getRequestContext(req);
      this.logger.info('Fetching Hostaway reviews', context);

      const filters = this.extractFilters(req);
      const pagination = this.extractPagination(req);

      const result = await this.reviewService.getReviews(filters, pagination);

      // Transform the response to match expected format
      const response = {
        properties: this.groupReviewsByProperty(result.reviews),
        allReviews: result.reviews,
        summary: {
          totalProperties: this.getUniquePropertiesCount(result.reviews),
          totalReviews: result.total,
          averageOverallRating: result.analytics.averageRating
        },
        meta: {
          dataSource: 'service',
          timestamp: new Date().toISOString(),
          pagination: {
            total: result.total,
            limit: pagination.limit,
            offset: pagination.offset,
            hasMore: result.total > pagination.offset + pagination.limit
          }
        }
      };

      this.sendSuccess(res, response);
    } catch (error) {
      this.logger.error('Failed to fetch Hostaway reviews', error as Error, this.getRequestContext(req));
      throw error;
    }
  };

  // GET /api/reviews/sync
  public syncReviews = async (req: Request, res: Response): Promise<void> => {
    try {
      const context = this.getRequestContext(req);
      this.logger.info('Starting review synchronization', context);

      const result = await this.reviewService.syncReviewsFromSources();

      this.sendSuccess(res, result, 'Review synchronization completed');
    } catch (error) {
      this.logger.error('Review synchronization failed', error as Error, this.getRequestContext(req));
      throw error;
    }
  };

  private groupReviewsByProperty(reviews: any[]) {
    const grouped = reviews.reduce((acc, review) => {
      const propertyName = review.propertyName;
      if (!acc[propertyName]) {
        acc[propertyName] = {
          propertyName,
          averageRating: 0,
          totalReviews: 0,
          reviews: []
        };
      }
      acc[propertyName].reviews.push(review);
      acc[propertyName].totalReviews++;
      return acc;
    }, {} as Record<string, any>);

    // Calculate average ratings
    Object.values(grouped).forEach((property: any) => {
      const validRatings = property.reviews
        .map((r: any) => r.overallRating)
        .filter((rating: number) => rating > 0);
      
      property.averageRating = validRatings.length > 0
        ? validRatings.reduce((sum: number, rating: number) => sum + rating, 0) / validRatings.length
        : 0;
    });

    return Object.values(grouped);
  }

  private getUniquePropertiesCount(reviews: any[]): number {
    const uniqueProperties = new Set(reviews.map(r => r.propertyName));
    return uniqueProperties.size;
  }
}