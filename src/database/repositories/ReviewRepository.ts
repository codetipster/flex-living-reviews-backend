import { ReviewEntity, ReviewChannel, ReviewCategories, ReviewStatus } from '../models/Review';

export interface ReviewFilters {
  propertyId?: string;
  propertyName?: string;
  minRating?: number;
  maxRating?: number;
  category?: keyof ReviewCategories;
  channel?: ReviewChannel;
  timeFrom?: Date;
  timeTo?: Date;
  isApprovedForPublic?: boolean;
  status?: ReviewStatus;
}

export interface PaginationParams {
  limit: number;
  offset: number;
  sortBy: string;
  sortOrder: 'asc' | 'desc';
}

export interface ReviewRepository {
  findMany(filters: ReviewFilters, pagination: PaginationParams): Promise<{
    reviews: ReviewEntity[];
    total: number;
  }>;
  
  findById(id: string): Promise<ReviewEntity | null>;
  
  findByPropertyName(
    propertyName: string, 
    filters?: Partial<ReviewFilters>,
    pagination?: Partial<PaginationParams>
  ): Promise<{
    reviews: ReviewEntity[];
    total: number;
  }>;
  
  create(review: Omit<ReviewEntity, 'id' | 'createdAt' | 'updatedAt'>): Promise<ReviewEntity>;
  
  update(id: string, updates: Partial<ReviewEntity>): Promise<ReviewEntity>;
  
  bulkUpsert(reviews: Partial<ReviewEntity>[]): Promise<ReviewEntity[]>;
  
  approveForPublic(id: string, approvedBy: string): Promise<ReviewEntity>;
  
  removeApproval(id: string): Promise<ReviewEntity>;
  
  getPropertyAnalytics(propertyName?: string): Promise<{
    totalReviews: number;
    averageRating: number;
    ratingDistribution: Record<string, number>;
    categoryAverages: ReviewCategories;
    approvedCount: number;
  }>;
}
