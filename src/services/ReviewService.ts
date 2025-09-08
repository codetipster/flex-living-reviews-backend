import { injectable, inject } from 'inversify';
import { ReviewRepository, ReviewFilters, PaginationParams } from '../database/repositories/ReviewRepository';
import { ReviewEntity, ReviewCategories, ReviewChannel, ReviewStatus, ReviewType } from '../database/models/Review';
import { IReviewService } from './interfaces/IReviewService';
import { ExternalReviewProvider } from './providers/ExternalReviewProvider';
import { Logger } from '@/utils/Logger';
import { CacheService } from '@/services/CacheService';
import { ValidationService } from '@/services/ValidationService';

@injectable()
export class ReviewService implements IReviewService {
  constructor(
    @inject('ReviewRepository') private reviewRepo: ReviewRepository,
    @inject('ExternalReviewProvider') private externalProvider: ExternalReviewProvider,
    @inject('Logger') private logger: Logger,
    @inject('CacheService') private cache: CacheService,
    @inject('ValidationService') private validator: ValidationService
  ) {}

  async getReviews(filters: ReviewFilters, pagination: PaginationParams) {
  try {
    this.validator.validateFilters(filters);
    this.validator.validatePagination(pagination);

    // Check if repository is empty and auto-populate if needed
    const { total: existingTotal } = await this.reviewRepo.findMany({}, { 
      limit: 1, 
      offset: 0, 
      sortBy: 'date', 
      sortOrder: 'desc' 
    });
    
    if (existingTotal === 0) {
      this.logger.info('Repository empty, syncing from external sources');
      await this.syncReviewsFromSources();
    }

    const cacheKey = this.generateCacheKey('reviews', filters, pagination);
    const cached = await this.cache.get<any>(cacheKey);
    
    if (cached) {
      this.logger.debug('Returning cached reviews', { cacheKey });
      return cached;
    }

    const { reviews, total } = await this.reviewRepo.findMany(filters, pagination);
    const analytics = await this.reviewRepo.getPropertyAnalytics(filters.propertyName);

    const result = { reviews, total, analytics };
    
    // Cache for 5 minutes
    await this.cache.set(cacheKey, result, 300);
    
    this.logger.info('Retrieved reviews', { 
      total, 
      filters: this.sanitizeFilters(filters),
      pagination 
    });

    return result;
  } catch (error) {
    this.logger.error('Failed to get reviews', error as Error, { filters, pagination });
    throw error;
  }
}

  async getReviewById(id: string): Promise<ReviewEntity | null> {
    this.validator.validateId(id);
    
    const cacheKey = `review:${id}`;
    const cached = await this.cache.get<ReviewEntity>(cacheKey);
    
    if (cached) {
      return cached;
    }

    const review = await this.reviewRepo.findById(id);
    
    if (review) {
      await this.cache.set(cacheKey, review, 600); // Cache for 10 minutes
    }

    return review;
  }

  async getPublicReviews(propertyName: string, pagination: Partial<PaginationParams> = {}) {
    const decodedPropertyName = decodeURIComponent(propertyName);
    this.validator.validatePropertyName(decodedPropertyName);

    const fullPagination = {
      limit: 10,
      offset: 0,
      sortBy: 'date',
      sortOrder: 'desc' as const,
      ...pagination
    };

    const filters: ReviewFilters = {
      propertyName: decodedPropertyName,
      isApprovedForPublic: true
    };

    const { reviews, total } = await this.reviewRepo.findMany(filters, fullPagination);
    const analytics = await this.reviewRepo.getPropertyAnalytics(decodedPropertyName);

    const propertyInfo = {
      name: decodedPropertyName,
      averageRating: analytics.averageRating,
      totalApprovedReviews: total
    };

    this.logger.info('Retrieved public reviews', {
      propertyName: decodedPropertyName,
      total,
      pagination: fullPagination
    });

    return { reviews, total, propertyInfo };
  }

  async approveReview(reviewId: string, approvedBy: string): Promise<ReviewEntity> {
    this.validator.validateId(reviewId);
    this.validator.validateApprover(approvedBy);

    const review = await this.reviewRepo.findById(reviewId);
    if (!review) {
      throw new Error(`Review with id ${reviewId} not found`);
    }

    if (review.isApprovedForPublic) {
      this.logger.warn('Attempting to approve already approved review', { reviewId });
      return review;
    }

    const updatedReview = await this.reviewRepo.approveForPublic(reviewId, approvedBy);
    
    // Invalidate related caches
    await this.invalidateReviewCaches(review.propertyName);
    
    this.logger.info('Review approved for public display', {
      reviewId,
      approvedBy,
      propertyName: review.propertyName
    });

    return updatedReview;
  }

  async removeApproval(reviewId: string): Promise<ReviewEntity> {
    this.validator.validateId(reviewId);

    const review = await this.reviewRepo.findById(reviewId);
    if (!review) {
      throw new Error(`Review with id ${reviewId} not found`);
    }

    if (!review.isApprovedForPublic) {
      this.logger.warn('Attempting to remove approval from non-approved review', { reviewId });
      return review;
    }

    const updatedReview = await this.reviewRepo.removeApproval(reviewId);
    
    // Invalidate related caches
    await this.invalidateReviewCaches(review.propertyName);
    
    this.logger.info('Review approval removed', {
      reviewId,
      propertyName: review.propertyName
    });

    return updatedReview;
  }

  async syncReviewsFromSources(): Promise<{
    synced: number;
    errors: string[];
    sources: string[];
  }> {
    const results = {
      synced: 0,
      errors: [] as string[],
      sources: [] as string[]
    };

    try {
      this.logger.info('Starting review synchronization from external sources');

      // Sync from Hostaway
      try {
        const hostawayReviews = await this.externalProvider.fetchFromHostaway();
        const normalizedReviews = hostawayReviews.map((review) => this.normalizeExternalReview(review));
        
        const syncedReviews = await this.reviewRepo.bulkUpsert(normalizedReviews);
        results.synced += syncedReviews.length;
        results.sources.push('hostaway');
        
        this.logger.info('Synced reviews from Hostaway', { count: syncedReviews.length });
      } catch (error:any) {
        const errorMsg = `Hostaway sync failed: ${error.message}`;
        results.errors.push(errorMsg);
        this.logger.error('Hostaway sync failed', error);
      }

      // Sync from Google Reviews (if configured)
      try {
        const googleReviews = await this.externalProvider.fetchFromGoogle();
        if (googleReviews.length > 0) {
          const normalizedReviews = googleReviews.map((review) => this.normalizeExternalReview(review));
          const syncedReviews = await this.reviewRepo.bulkUpsert(normalizedReviews);
          results.synced += syncedReviews.length;
          results.sources.push('google');
          
          this.logger.info('Synced reviews from Google', { count: syncedReviews.length });
        }
      } catch (error:any) {
        const errorMsg = `Google sync failed: ${error.message}`;
        results.errors.push(errorMsg);
        this.logger.error('Google sync failed', error);
      }

      // Invalidate all caches after sync
      await this.cache.deletePattern('reviews:*');
      await this.cache.deletePattern('review:*');

      this.logger.info('Review synchronization completed', results);
      return results;

    } catch (error) {
      this.logger.error('Review synchronization failed', error as Error);
      throw error;
    }
  }

  private normalizeExternalReview(externalReview: any): Partial<ReviewEntity> {
    const averageRating = this.calculateAverageRating(externalReview.reviewCategory || []);
    
    return {
      externalId: externalReview.id?.toString(),
      propertyName: externalReview.listingName || 'Unknown Property',
      guestName: externalReview.guestName || 'Anonymous',
      reviewText: externalReview.publicReview || '',
      overallRating: externalReview.rating || averageRating / 2, // Convert 10-point to 5-point
      categories: this.normalizeCategories(externalReview.reviewCategory || []),
      submittedAt: new Date(externalReview.submittedAt),
      channel: this.determineChannel(externalReview),
      status: ReviewStatus.PUBLISHED,
      type: externalReview.type === 'host-to-guest' ? ReviewType.HOST_TO_GUEST : ReviewType.GUEST_TO_HOST,
      isApprovedForPublic: false
    };
  }

  private calculateAverageRating(categories: Array<{category: string, rating: number}>): number {
    if (!categories || categories.length === 0) return 0;
    const sum = categories.reduce((acc, cat) => acc + cat.rating, 0);
    return Math.round((sum / categories.length) * 10) / 10;
  }

  private normalizeCategories(categories: Array<{category: string, rating: number}>): ReviewCategories {
    const normalized = {
      cleanliness: 0,
      communication: 0,
      respect_house_rules: 0
    };

    categories.forEach(cat => {
      const rating = Math.round((cat.rating / 2) * 10) / 10; // Convert 10-point to 5-point
      if (cat.category in normalized) {
        normalized[cat.category as keyof ReviewCategories] = rating;
      }
    });

    return normalized;
  }

  private determineChannel(externalReview: any): ReviewChannel {
    // Logic to determine the source channel
    if (externalReview.source === 'google') return ReviewChannel.GOOGLE;
    return ReviewChannel.HOSTAWAY; // Default
  }

  private generateCacheKey(prefix: string, filters: any, pagination?: any): string {
    const filterStr = Object.keys(filters)
      .sort()
      .map(key => `${key}:${filters[key]}`)
      .join('|');
    
    const paginationStr = pagination 
      ? `|${pagination.limit}:${pagination.offset}:${pagination.sortBy}:${pagination.sortOrder}`
      : '';
    
    return `${prefix}:${Buffer.from(filterStr + paginationStr).toString('base64')}`;
  }

  private sanitizeFilters(filters: ReviewFilters): any {
    // Remove sensitive information from logs
    const { ...sanitized } = filters;
    return sanitized;
  }

  private async invalidateReviewCaches(propertyName: string): Promise<void> {
    const patterns = [
      'reviews:*',
      `review:*`,
      `public-reviews:${propertyName}:*`
    ];

    await Promise.all(patterns.map(pattern => this.cache.deletePattern(pattern)));
  }
}
