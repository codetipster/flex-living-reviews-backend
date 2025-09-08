// src/controllers/PublicController.ts
import { Request, Response } from 'express';
import { inject, injectable } from 'inversify';
import { BaseController } from './BaseController';
import { IReviewService } from '../services/interfaces/IReviewService';
import { Logger } from '../utils/Logger';

@injectable()
export class PublicController extends BaseController {
  constructor(
    @inject('Logger') logger: Logger,
    @inject('ReviewService') private reviewService: IReviewService
  ) {
    super(logger);
  }

  // GET /api/public/reviews/:propertyName
  public getPublicReviews = async (req: Request, res: Response): Promise<void> => {
  try {
    const { propertyName } = req.params;
    
    if (!propertyName) {
      throw new Error('Property name is required');
    }
    
    const pagination = this.extractPagination(req);
    const context = { ...this.getRequestContext(req), propertyName };

    this.logger.info('Fetching public reviews for property', context);

    const result = await this.reviewService.getPublicReviews(propertyName, pagination);

    const response = {
      property: result.propertyInfo,
      reviews: result.reviews,
      pagination: {
        total: result.total,
        limit: pagination.limit,
        offset: pagination.offset,
        hasMore: result.total > pagination.offset + pagination.limit
      }
    };

    this.sendSuccess(res, response);
  } catch (error) {
    this.logger.error('Failed to fetch public reviews', error as Error, this.getRequestContext(req));
    throw error;
  }
};
}