import { AppError, ErrorCode } from '../../src/utils/errors/AppError';

describe('AppError', () => {
  describe('constructor', () => {

    it('should default isOperational to true when not provided', () => {
      const error = new AppError('Test', 400, ErrorCode.VALIDATION_ERROR);
      expect(error.isOperational).toBe(true);
    });

    it('should maintain proper stack trace', () => {
      const error = new AppError('Test', 400, ErrorCode.VALIDATION_ERROR);
      expect(error.stack).toBeDefined();
      expect(error.stack).toContain('AppError');
    });
  });

  describe('static factory methods', () => {
    describe('validation', () => {
      it('should create a validation error with correct properties', () => {
        const message = 'Validation failed';
        const context = { field: 'email' };

        const error = AppError.validation(message, context);

        expect(error.message).toBe(message);
        expect(error.statusCode).toBe(400);
        expect(error.code).toBe(ErrorCode.VALIDATION_ERROR);
        expect(error.isOperational).toBe(true);
        expect(error.context).toEqual(context);
      });

      it('should work without context', () => {
        const error = AppError.validation('Simple validation error');
        expect(error.context).toBeUndefined();
      });
    });

    describe('notFound', () => {
      it('should create a not found error with correct properties', () => {
        const message = 'Resource not found';
        const context = { id: '123' };

        const error = AppError.notFound(message, context);

        expect(error.message).toBe(message);
        expect(error.statusCode).toBe(404);
        expect(error.code).toBe(ErrorCode.REVIEW_NOT_FOUND);
        expect(error.isOperational).toBe(true);
        expect(error.context).toEqual(context);
      });
    });

    describe('externalService', () => {
      it('should create an external service error with correct properties', () => {
        const message = 'External API failed';
        const code = ErrorCode.HOSTAWAY_API_ERROR;
        const context = { service: 'hostaway' };

        const error = AppError.externalService(message, code, context);

        expect(error.message).toBe(message);
        expect(error.statusCode).toBe(502);
        expect(error.code).toBe(code);
        expect(error.isOperational).toBe(true);
        expect(error.context).toEqual(context);
      });
    });

    describe('internal', () => {
      it('should create an internal error with correct properties', () => {
        const message = 'Internal server error';
        const context = { operation: 'database' };

        const error = AppError.internal(message, context);

        expect(error.message).toBe(message);
        expect(error.statusCode).toBe(500);
        expect(error.code).toBe(ErrorCode.INTERNAL_SERVER_ERROR);
        expect(error.isOperational).toBe(false);
        expect(error.context).toEqual(context);
      });
    });
  });

  describe('toJSON', () => {
    it('should serialize error to JSON with all properties', () => {
      const message = 'Test error';
      const context = { field: 'test' };
      const error = new AppError(message, 400, ErrorCode.VALIDATION_ERROR, true, context);

      const json = error.toJSON();

      expect(json).toHaveProperty('message', message);
      expect(json).toHaveProperty('statusCode', 400);
      expect(json).toHaveProperty('code', ErrorCode.VALIDATION_ERROR);
      expect(json).toHaveProperty('context', context);
      expect(json).toHaveProperty('timestamp');
      expect(json.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
    });

    it('should not include context in JSON when undefined', () => {
      const error = new AppError('Test', 400, ErrorCode.VALIDATION_ERROR);
      const json = error.toJSON();

      expect(json.context).toBeUndefined();
    });
  });

  describe('ErrorCode enum', () => {
    it('should have all expected error codes', () => {
      expect(ErrorCode.VALIDATION_ERROR).toBe('VALIDATION_ERROR');
      expect(ErrorCode.REVIEW_NOT_FOUND).toBe('REVIEW_NOT_FOUND');
      expect(ErrorCode.HOSTAWAY_API_ERROR).toBe('HOSTAWAY_API_ERROR');
      expect(ErrorCode.INTERNAL_SERVER_ERROR).toBe('INTERNAL_SERVER_ERROR');
    });
  });
});
