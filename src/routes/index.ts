import { Router } from 'express';
import { container } from '../container/Container';
import { ReviewController } from '../controllers/ReviewController';
import { ManagerController } from '../controllers/ManagerController';
import { PublicController } from '../controllers/PublicController';
import { HealthController } from '../controllers/HealthController';
import { ErrorHandler } from '../middlewares/ErrorHandler';
import { RequestLogger } from '../middlewares/RequestLogger';
import {
  validateReviewFilters,
  validateReviewApproval,
  validatePropertyName
} from '../middlewares/ValidationMiddleware';
import {
  publicApiLimiter,
  managerApiLimiter,
  syncApiLimiter
} from '../middlewares/RateLimiter';

const router = Router();

// Get controller instances from DI container
const reviewController = container.get<ReviewController>('ReviewController');
const managerController = container.get<ManagerController>('ManagerController');
const publicController = container.get<PublicController>('PublicController');
const healthController = container.get<HealthController>('HealthController');
const errorHandler = container.get<ErrorHandler>('ErrorHandler');
const requestLogger = container.get<RequestLogger>('RequestLogger');

// Global middleware
router.use(requestLogger.log);

// Health check (no rate limiting)
router.get('/health', healthController.getHealth);

// Review routes
router.get('/api/reviews/hostaway', 
  managerApiLimiter,
  validateReviewFilters,
  reviewController.getHostawayReviews
);

router.post('/api/reviews/sync',
  syncApiLimiter,
  reviewController.syncReviews
);

// Manager routes
router.get('/api/manager/dashboard',
  managerApiLimiter,
  validateReviewFilters,
  managerController.getDashboard
);

router.post('/api/manager/approve-review',
  managerApiLimiter,
  validateReviewApproval,
  managerController.approveReview
);

router.delete('/api/manager/approve-review',
  managerApiLimiter,
  validateReviewApproval,
  managerController.removeApproval
);

// Public routes
router.get('/api/public/reviews/:propertyName',
  publicApiLimiter,
  validatePropertyName,
  publicController.getPublicReviews
);

// 404 handler
router.all('*', (req, res) => {
  res.status(404).json({
    success: false,
    error: {
      message: 'Route not found',
      code: 'ROUTE_NOT_FOUND',
      path: req.path
    }
  });
});

// Global error handler
router.use(errorHandler.handle);

export default router;