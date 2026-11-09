export class AppError extends Error {
    public statusCode: number;
    public status: string;
    public isOperational: boolean;
  
    constructor(message: string, statusCode: number) {
      super(message);
      this.statusCode = statusCode;
      this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
      this.isOperational = true;
  
      Error.captureStackTrace(this, this.constructor);
    }
  }
  
  export class ValidationError extends AppError {
    constructor(message: string) {
      super(message, 400);
    }
  }
  
  export class UnauthorizedError extends AppError {
    constructor(message = 'Unauthorized access') {
      super(message, 401);
    }
  }
  
  export class ForbiddenError extends AppError {
    constructor(message = 'Access forbidden') {
      super(message, 403);
    }
  }
  
  export class NotFoundError extends AppError {
    constructor(message = 'Resource not found') {
      super(message, 404);
    }
  }
  
  export class ConflictError extends AppError {
    constructor(message = 'Resource already exists') {
      super(message, 409);
    }
  }
  
  export class RateLimitError extends AppError {
    constructor(message = 'Too many requests') {
      super(message, 429);
    }
  }
  
  export class InternalServerError extends AppError {
    constructor(message = 'Internal server error') {
      super(message, 500);
    }
  }