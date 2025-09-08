import { ReviewEntity  } from '../models/Review';
import { ReviewRepository, ReviewFilters, PaginationParams } from './ReviewRepository';
export class InMemoryReviewRepository implements ReviewRepository {
  private reviews: Map<string, ReviewEntity> = new Map();
  private idCounter = 1;

  async findMany(filters: ReviewFilters, pagination: PaginationParams) {
    let filteredReviews = Array.from(this.reviews.values());
    
    // Apply filters efficiently
    if (filters.propertyName) {
      const searchTerm = filters.propertyName.toLowerCase();
      filteredReviews = filteredReviews.filter(r => 
        r.propertyName.toLowerCase().includes(searchTerm)
      );
    }
    
    if (filters.minRating !== undefined) {
      filteredReviews = filteredReviews.filter(r => r.overallRating >= filters.minRating!);
    }
    
    if (filters.channel) {
      filteredReviews = filteredReviews.filter(r => r.channel === filters.channel);
    }
    
    if (filters.isApprovedForPublic !== undefined) {
      filteredReviews = filteredReviews.filter(r => r.isApprovedForPublic === filters.isApprovedForPublic);
    }
    
    if (filters.timeFrom) {
      filteredReviews = filteredReviews.filter(r => r.submittedAt >= filters.timeFrom!);
    }
    
    if (filters.timeTo) {
      filteredReviews = filteredReviews.filter(r => r.submittedAt <= filters.timeTo!);
    }

    // Apply sorting
    filteredReviews.sort((a, b) => {
      let aValue: any, bValue: any;
      
      switch (pagination.sortBy) {
        case 'rating':
          aValue = a.overallRating;
          bValue = b.overallRating;
          break;
        case 'date':
          aValue = a.submittedAt.getTime();
          bValue = b.submittedAt.getTime();
          break;
        case 'property':
          aValue = a.propertyName;
          bValue = b.propertyName;
          break;
        default:
          aValue = a.submittedAt.getTime();
          bValue = b.submittedAt.getTime();
      }
      
      if (pagination.sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

    const total = filteredReviews.length;
    const paginatedReviews = filteredReviews.slice(
      pagination.offset, 
      pagination.offset + pagination.limit
    );

    return { reviews: paginatedReviews, total };
  }

  async findById(id: string): Promise<ReviewEntity | null> {
    return this.reviews.get(id) || null;
  }

  async findByPropertyName(
    propertyName: string, 
    filters: Partial<ReviewFilters> = {},
    pagination: Partial<PaginationParams> = {}
  ) {
    const fullFilters = { ...filters, propertyName };
    const fullPagination = {
      limit: 50,
      offset: 0,
      sortBy: 'date',
      sortOrder: 'desc' as const,
      ...pagination
    };
    
    return this.findMany(fullFilters, fullPagination);
  }

  async create(reviewData: Omit<ReviewEntity, 'id' | 'createdAt' | 'updatedAt'>): Promise<ReviewEntity> {
    const now = new Date();
    const review: ReviewEntity = {
      id: (this.idCounter++).toString(),
      ...reviewData,
      createdAt: now,
      updatedAt: now
    };
    
    this.reviews.set(review.id, review);
    return review;
  }

  async update(id: string, updates: Partial<ReviewEntity>): Promise<ReviewEntity> {
    const existing = this.reviews.get(id);
    if (!existing) {
      throw new Error(`Review with id ${id} not found`);
    }
    
    const updated = {
      ...existing,
      ...updates,
      updatedAt: new Date()
    };
    
    this.reviews.set(id, updated);
    return updated;
  }

  async bulkUpsert(reviewsData: Partial<ReviewEntity>[]): Promise<ReviewEntity[]> {
    const results: ReviewEntity[] = [];
    
    for (const reviewData of reviewsData) {
      if (reviewData.externalId) {
        // Find existing by external ID
        const existing = Array.from(this.reviews.values())
          .find(r => r.externalId === reviewData.externalId);
          
        if (existing) {
          const updated = await this.update(existing.id, reviewData);
          results.push(updated);
        } else {
          const created = await this.create(reviewData as Omit<ReviewEntity, 'id' | 'createdAt' | 'updatedAt'>);
          results.push(created);
        }
      }
    }
    
    return results;
  }

  async approveForPublic(id: string, approvedBy: string): Promise<ReviewEntity> {
    return this.update(id, {
      isApprovedForPublic: true,
      approvedAt: new Date(),
      approvedBy
    });
  }

  async removeApproval(id: string): Promise<ReviewEntity> {
  const existing = this.reviews.get(id);
  if (!existing) {
    throw new Error(`Review with id ${id} not found`);
  }
  
  const updated = {
    ...existing,
    isApprovedForPublic: false,
    updatedAt: new Date()
  };
  
  // Remove the optional fields entirely
  delete updated.approvedAt;
  delete updated.approvedBy;
  
  this.reviews.set(id, updated);
  return updated;
}

  async getPropertyAnalytics(propertyName?: string) {
    let reviews = Array.from(this.reviews.values());
    
    if (propertyName) {
      reviews = reviews.filter(r => 
        r.propertyName.toLowerCase().includes(propertyName.toLowerCase())
      );
    }

    const totalReviews = reviews.length;
    const validRatings = reviews.filter(r => r.overallRating > 0);
    const averageRating = validRatings.length > 0 
      ? validRatings.reduce((sum, r) => sum + r.overallRating, 0) / validRatings.length 
      : 0;

    const ratingDistribution = {
      '9-10': reviews.filter(r => r.overallRating >= 4.5).length,
      '7-8': reviews.filter(r => r.overallRating >= 3.5 && r.overallRating < 4.5).length,
      '5-6': reviews.filter(r => r.overallRating >= 2.5 && r.overallRating < 3.5).length,
      '1-4': reviews.filter(r => r.overallRating < 2.5).length
    };

    const categoryAverages = {
      cleanliness: reviews.reduce((sum, r) => sum + r.categories.cleanliness, 0) / reviews.length,
      communication: reviews.reduce((sum, r) => sum + r.categories.communication, 0) / reviews.length,
      respect_house_rules: reviews.reduce((sum, r) => sum + r.categories.respect_house_rules, 0) / reviews.length
    };

    const approvedCount = reviews.filter(r => r.isApprovedForPublic).length;

    return {
      totalReviews,
      averageRating: Math.round(averageRating * 100) / 100,
      ratingDistribution,
      categoryAverages,
      approvedCount
    };
  }
}