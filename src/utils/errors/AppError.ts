export enum ErrorCode {
  // Validation Errors (400x)
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  INVALID_FILTERS = 'INVALID_FILTERS',
  INVALID_PAGINATION = 'INVALID_PAGINATION',
  INVALID_REVIEW_ID = 'INVALID_REVIEW_ID',
  
  // Not Found Errors (404x)
  REVIEW_NOT_FOUND = 'REVIEW_NOT_FOUND',
  PROPERTY_NOT_FOUND = 'PROPERTY_NOT_FOUND',
  
  // Authorization Errors (403x)
  INSUFFICIENT_PERMISSIONS = 'INSUFFICIENT_PERMISSIONS',
  
  // External Service Errors (502x)
  HOSTAWAY_API_ERROR = 'HOSTAWAY_API_ERROR',
  GOOGLE_API_ERROR = 'GOOGLE_API_ERROR',
  EXTERNAL_SERVICE_TIMEOUT = 'EXTERNAL_SERVICE_TIMEOUT',
  
  // Internal Errors (500x)
  DATABASE_ERROR = 'DATABASE_ERROR',
  CACHE_ERROR = 'CACHE_ERROR',
  INTERNAL_SERVER_ERROR = 'INTERNAL_SERVER_ERROR'
}

export class AppError extends Error {
  public readonly statusCode: number;
  public readonly code: ErrorCode;
  public readonly isOperational: boolean;
  public readonly context?: Record<string, any> | undefined;

  constructor(
    message: string,
    statusCode: number,
    code: ErrorCode,
    isOperational: boolean = true,
    context?: Record<string, any>
  ) {
    super(message);
    
    this.statusCode = statusCode;
    this.code = code;
    this.isOperational = isOperational;
    this.context = context;
    
    // Maintain proper stack trace
    Error.captureStackTrace(this, this.constructor);
  }

  static validation(message: string, context?: Record<string, any>): AppError {
    return new AppError(message, 400, ErrorCode.VALIDATION_ERROR, true, context);
  }

  static notFound(message: string, context?: Record<string, any>): AppError {
    return new AppError(message, 404, ErrorCode.REVIEW_NOT_FOUND, true, context);
  }

  static externalService(message: string, code: ErrorCode, context?: Record<string, any>): AppError {
    return new AppError(message, 502, code, true, context);
  }

  static internal(message: string, context?: Record<string, any>): AppError {
    return new AppError(message, 500, ErrorCode.INTERNAL_SERVER_ERROR, false, context);
  }

  toJSON() {
    return {
      message: this.message,
      statusCode: this.statusCode,
      code: this.code,
      context: this.context,
      timestamp: new Date().toISOString()
    };
  }
}