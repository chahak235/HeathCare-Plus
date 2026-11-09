import { Request, Response, NextFunction } from 'express';
import { StatusCodes } from 'http-status-codes';
import { AppError } from '../utils/errors/AppError';
import { isProduction } from '../config/environment';

export const errorHandler = (
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  // Log error for monitoring
  console.error('Error:', {
    message: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method,
    ip: req.ip,
    timestamp: new Date().toISOString(),
  });

  // Default error response
  let statusCode = StatusCodes.INTERNAL_SERVER_ERROR;
  let message = 'Something went wrong!';
  let errorCode = 'INTERNAL_ERROR';

  // Handle AppError instances
  if (err instanceof AppError) {
    statusCode = err.statusCode;
    message = err.message;
    errorCode = err.constructor.name.replace('Error', '').toUpperCase();
  }

  // Handle JWT errors
  if (err.name === 'JsonWebTokenError') {
    statusCode = StatusCodes.UNAUTHORIZED;
    message = 'Invalid token';
    errorCode = 'INVALID_TOKEN';
  }

  if (err.name === 'TokenExpiredError') {
    statusCode = StatusCodes.UNAUTHORIZED;
    message = 'Token expired';
    errorCode = 'TOKEN_EXPIRED';
  }

  // Handle validation errors
  if (err.name === 'ValidationError') {
    statusCode = StatusCodes.BAD_REQUEST;
    message = err.message;
    errorCode = 'VALIDATION_ERROR';
  }

  // Response object
  const response: any = {
    success: false,
    error: {
      code: errorCode,
      message,
      ...(!isProduction && { stack: err.stack }),
    },
    timestamp: new Date().toISOString(),
    path: req.path,
  };

  // Add validation errors if available
  if ((err as any).errors) {
    response.error.details = (err as any).errors;
  }

  res.status(statusCode).json(response);
};