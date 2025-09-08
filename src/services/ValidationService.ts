import { injectable } from 'inversify';
import { ReviewFilters, PaginationParams } from '../database/repositories/ReviewRepository';

@injectable()
export class ValidationService {
  validateFilters(filters: ReviewFilters): void {
    // Internal ratings are 0-5 (converted from external 10-point scale)
    if (filters.minRating !== undefined && (filters.minRating < 0 || filters.minRating > 5)) {
      throw new Error('Rating must be between 0 and 5');
    }
    
    if (filters.timeFrom && filters.timeTo && filters.timeFrom > filters.timeTo) {
      throw new Error('timeFrom must be before timeTo');
    }
  }

  validatePagination(pagination: PaginationParams): void {
    if (pagination.limit < 1 || pagination.limit > 100) {
      throw new Error('Limit must be between 1 and 100');
    }
    
    if (pagination.offset < 0) {
      throw new Error('Offset must be non-negative');
    }
    
    const validSortFields = ['date', 'rating', 'property'];
    if (!validSortFields.includes(pagination.sortBy)) {
      throw new Error(`sortBy must be one of: ${validSortFields.join(', ')}`);
    }
    
    if (!['asc', 'desc'].includes(pagination.sortOrder)) {
      throw new Error('sortOrder must be asc or desc');
    }
  }

  validateId(id: string): void {
    if (!id || id.trim().length === 0) {
      throw new Error('ID is required');
    }
  }

  validatePropertyName(propertyName: string): void {
    if (!propertyName || propertyName.trim().length === 0) {
      throw new Error('Property name is required');
    }
  }

  validateApprover(approver: string): void {
    if (!approver || approver.trim().length === 0) {
      throw new Error('Approver is required');
    }
  }
}