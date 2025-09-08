import { ReviewEntity, ReviewCategories } from '../../database/models/Review';
import { ReviewFilters, PaginationParams } from '../../database/repositories/ReviewRepository';

export interface ReviewAnalytics {
  totalReviews: number;
  averageRating: number;
  ratingDistribution: Record<string, number>;
  categoryAverages: ReviewCategories;
  approvedCount: number;
}

export interface PropertyInfo {
  name: string;
  averageRating: number;
  totalApprovedReviews: number;
}

export interface IReviewService {
  getReviews(filters: ReviewFilters, pagination: PaginationParams): Promise<{
    reviews: ReviewEntity[];
    total: number;
    analytics: ReviewAnalytics;
  }>;
  
  getReviewById(id: string): Promise<ReviewEntity | null>;
  
  getPublicReviews(propertyName: string, pagination?: Partial<PaginationParams>): Promise<{
    reviews: ReviewEntity[];
    total: number;
    propertyInfo: PropertyInfo;
  }>;
  
  approveReview(reviewId: string, approvedBy: string): Promise<ReviewEntity>;
  
  removeApproval(reviewId: string): Promise<ReviewEntity>;
  
  syncReviewsFromSources(): Promise<{
    synced: number;
    errors: string[];
    sources: string[];
  }>;
}