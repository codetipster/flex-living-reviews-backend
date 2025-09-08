// src/middlewares/ValidationMiddleware.ts
import { Request, Response, NextFunction } from 'express';
import { body, query, param, validationResult } from 'express-validator';
import { AppError } from '../utils/errors/AppError';

export const validateReviewFilters = [
  query('property').optional().isString().trim().isLength({ min: 1, max: 100 }),
  query('rating').optional().isFloat({ min: 0, max: 5 }),
  query('category').optional().isIn(['cleanliness', 'communication', 'respect_house_rules']),
  query('channel').optional().isIn(['hostaway', 'google']),
  query('timeFrom').optional().isISO8601(),
  query('timeTo').optional().isISO8601(),
  query('sortBy').optional().isIn(['date', 'rating', 'property']),
  query('sortOrder').optional().isIn(['asc', 'desc']),
  query('limit').optional().isInt({ min: 1, max: 100 }),
  query('offset').optional().isInt({ min: 0 }),
  
  (req: Request, _res: Response, next: NextFunction) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      throw AppError.validation('Invalid query parameters', {
        errors: errors.array()
      });
    }
    next();
  }
];

export const validateReviewApproval = [
  body('reviewId').notEmpty().isString().trim(),
  
  (req: Request, _res: Response, next: NextFunction) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      throw AppError.validation('Invalid request body', {
        errors: errors.array()
      });
    }
    next();
  }
];

export const validatePropertyName = [
  param('propertyName').notEmpty().isString().trim().isLength({ min: 1, max: 200 }),
  
  (req: Request, _res: Response, next: NextFunction) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      throw AppError.validation('Invalid property name', {
        errors: errors.array()
      });
    }
    next();
  }
];