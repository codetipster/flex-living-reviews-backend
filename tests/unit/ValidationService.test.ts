import { ValidationService } from '../../src/services/ValidationService';
import { ReviewFilters, PaginationParams } from '../../src/database/repositories/ReviewRepository';

describe('ValidationService', () => {
  let validationService: ValidationService;

  beforeEach(() => {
    validationService = new ValidationService();
  });

  describe('validateFilters', () => {
    it('should validate correct filter parameters', () => {
      const validFilters: ReviewFilters = {
        minRating: 3,
        timeFrom: new Date('2024-01-01'),
        timeTo: new Date('2024-12-31')
      };

      expect(() => validationService.validateFilters(validFilters)).not.toThrow();
    });

    it('should throw error for invalid rating range', () => {
      const invalidFilters: ReviewFilters = {
        minRating: 6
      };

      expect(() => validationService.validateFilters(invalidFilters))
        .toThrow('Rating must be between 0 and 5');
    });

    it('should allow negative ratings (0-5 range)', () => {
      const validFilters: ReviewFilters = {
        minRating: 0
      };

      expect(() => validationService.validateFilters(validFilters)).not.toThrow();
    });
  });

  describe('validatePagination', () => {
    it('should validate correct pagination parameters', () => {
      const validPagination: PaginationParams = {
        limit: 10,
        offset: 0,
        sortBy: 'date',
        sortOrder: 'desc'
      };

      expect(() => validationService.validatePagination(validPagination)).not.toThrow();
    });

    it('should throw error for invalid limit', () => {
      const invalidPagination: PaginationParams = {
        limit: 0,
        offset: 0,
        sortBy: 'date',
        sortOrder: 'desc'
      };

      expect(() => validationService.validatePagination(invalidPagination))
        .toThrow('Limit must be between 1 and 100');
    });

    it('should throw error for limit exceeding maximum', () => {
      const invalidPagination: PaginationParams = {
        limit: 101,
        offset: 0,
        sortBy: 'date',
        sortOrder: 'desc'
      };

      expect(() => validationService.validatePagination(invalidPagination))
        .toThrow('Limit must be between 1 and 100');
    });

    it('should throw error for negative offset', () => {
      const invalidPagination: PaginationParams = {
        limit: 10,
        offset: -1,
        sortBy: 'date',
        sortOrder: 'desc'
      };

      expect(() => validationService.validatePagination(invalidPagination))
        .toThrow('Offset must be non-negative');
    });

    it('should throw error for invalid sortBy field', () => {
      const invalidPagination: PaginationParams = {
        limit: 10,
        offset: 0,
        sortBy: 'invalid' as any,
        sortOrder: 'desc'
      };

      expect(() => validationService.validatePagination(invalidPagination))
        .toThrow('sortBy must be one of: date, rating, property');
    });

    it('should throw error for invalid sortOrder', () => {
      const invalidPagination: PaginationParams = {
        limit: 10,
        offset: 0,
        sortBy: 'date',
        sortOrder: 'invalid' as any
      };

      expect(() => validationService.validatePagination(invalidPagination))
        .toThrow('sortOrder must be asc or desc');
    });
  });

  describe('validateId', () => {
    it('should validate non-empty ID', () => {
      expect(() => validationService.validateId('valid-id')).not.toThrow();
    });

    it('should throw error for empty ID', () => {
      expect(() => validationService.validateId(''))
        .toThrow('ID is required');
    });

    it('should throw error for whitespace-only ID', () => {
      expect(() => validationService.validateId('   '))
        .toThrow('ID is required');
    });
  });

  describe('validatePropertyName', () => {
    it('should validate non-empty property name', () => {
      expect(() => validationService.validatePropertyName('Valid Property')).not.toThrow();
    });

    it('should throw error for empty property name', () => {
      expect(() => validationService.validatePropertyName(''))
        .toThrow('Property name is required');
    });

    it('should throw error for whitespace-only property name', () => {
      expect(() => validationService.validatePropertyName('   '))
        .toThrow('Property name is required');
    });
  });

  describe('validateApprover', () => {
    it('should validate non-empty approver', () => {
      expect(() => validationService.validateApprover('admin')).not.toThrow();
    });

    it('should throw error for empty approver', () => {
      expect(() => validationService.validateApprover(''))
        .toThrow('Approver is required');
    });

    it('should throw error for whitespace-only approver', () => {
      expect(() => validationService.validateApprover('   '))
        .toThrow('Approver is required');
    });
  });
});
