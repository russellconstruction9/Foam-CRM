import { Request, Response, NextFunction } from 'express';
// import { logger } from '../utils/logger';

interface ErrorWithStatus extends Error {
  status?: number;
  statusCode?: number;
}

export const errorHandler = (
  err: ErrorWithStatus,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  // Log error
  // logger.error('Error occurred:', {
  //   message: err.message,
  //   stack: err.stack,
  //   url: req.url,
  //   method: req.method,
  //   ip: req.ip,
  //   userAgent: req.get('User-Agent')
  // });

  // Default error status and message
  let status = err.status || err.statusCode || 500;
  let message = err.message || 'Internal Server Error';

  // Handle specific error types
  if (err.name === 'ValidationError') {
    status = 400;
    message = 'Validation Error';
  } else if (err.name === 'CastError') {
    status = 400;
    message = 'Invalid ID format';
  } else if (err.name === 'MongoError' || err.name === 'BulkWriteError') {
    status = 400;
    message = 'Database Error';
  } else if (err.name === 'JsonWebTokenError') {
    status = 401;
    message = 'Invalid token';
  } else if (err.name === 'TokenExpiredError') {
    status = 401;
    message = 'Token expired';
  }

  // Don't leak error details in production
  if (process.env.NODE_ENV === 'production' && status === 500) {
    message = 'Internal Server Error';
  }

  res.status(status).json({
    success: false,
    message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
};

export const notFoundHandler = (req: Request, res: Response): void => {
  res.status(404).json({
    success: false,
    message: 'Route not found'
  });
};

export const asyncHandler = (fn: Function) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};