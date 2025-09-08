import { Request, Response } from 'express';
import { inject, injectable } from 'inversify';
import { BaseController } from './BaseController';
import { IReviewService } from '../services/interfaces/IReviewService';
import { Logger } from '../utils/Logger';

@injectable()
export class ManagerController extends BaseController {
  constructor(
    @inject('Logger') logger: Logger,
    @inject('ReviewService') private reviewService: IReviewService
  ) {
    super(logger);
  }

  // GET /api/manager/dashboard
  public getDashboard = async (req: Request, res: Response): Promise<void> => {
    try {
      const context = this.getRequestContext(req);
      this.logger.info('Fetching manager dashboard data', context);

      const filters = this.extractFilters(req);
      const pagination = this.extractPagination(req);

      const result = await this.reviewService.getReviews(filters, pagination);

      const response = {
        reviews: result.reviews,
        analytics: result.analytics,
        pagination: {
          total: result.total,
          limit: pagination.limit,
          offset: pagination.offset,
          hasMore: result.total > pagination.offset + pagination.limit
        },
        filters
      };

      this.sendSuccess(res, response);
    } catch (error) {
      this.logger.error('Failed to fetch dashboard data', error as Error, this.getRequestContext(req));
      throw error;
    }
  };

  // POST /api/manager/approve-review
  public approveReview = async (req: Request, res: Response): Promise<void> => {
    try {
      const { reviewId } = req.body;
      const approvedBy = req.headers['x-user-id'] as string || 'system'; // In real app, get from auth
      const context = { ...this.getRequestContext(req), reviewId, approvedBy };

      this.logger.info('Approving review for public display', context);

      const updatedReview = await this.reviewService.approveReview(reviewId, approvedBy);

      this.sendSuccess(res, {
        review: updatedReview,
        message: 'Review approved for public display'
      });
    } catch (error) {
      this.logger.error('Failed to approve review', error as Error, this.getRequestContext(req));
      throw error;
    }
  };

  // DELETE /api/manager/approve-review
  public removeApproval = async (req: Request, res: Response): Promise<void> => {
    try {
      const { reviewId } = req.body;
      const context = { ...this.getRequestContext(req), reviewId };

      this.logger.info('Removing review approval', context);

      const updatedReview = await this.reviewService.removeApproval(reviewId);

      this.sendSuccess(res, {
        review: updatedReview,
        message: 'Review approval removed'
      });
    } catch (error) {
      this.logger.error('Failed to remove review approval', error as Error, this.getRequestContext(req));
      throw error;
    }
  };
}