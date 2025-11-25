// backend/src/middleware/errorHandler.ts
/**
 * Global Error Handling Middleware
 * 
 * Centralized error handling for the entire application.
 * Catches all errors from route handlers and middleware,
 * then returns appropriate HTTP responses with consistent formatting.
 * Includes special handling for different error types (MongoDB, JWT, Validation).
 */

import { Request, Response, NextFunction } from 'express';

/**
 * Custom Error Interface for structured error handling
 */
interface AppError extends Error {
  statusCode?: number;
  code?: number;
  keyPattern?: Record<string, unknown>;
  errors?: Record<string, { message: string }>;
}

/**
 * Global Error Handler Middleware
 * 
 * Must be the last middleware in the stack to catch all errors.
 * Formats errors consistently and provides appropriate HTTP status codes.
 * 
 * @param err - The error object thrown from anywhere in the app
 * @param req - Express request object
 * @param res - Express response object
 * @param next - Express next function (not used in error handler)
 */
export const errorHandler = (
  err: AppError,
  req: Request,
  res: Response,
  _next: NextFunction
): void => {
  // Log error details for debugging (with request context)
  console.error('🚨 Error occurred:', {
    message: err.message,
    stack: err.stack,
    url: req.url,
    method: req.method,
    ip: req.ip,
    timestamp: new Date().toISOString()
  });

  // Initialize default error response
  let statusCode = err.statusCode || 500;
  let message = err.message || 'Internal Server Error';
  let details = undefined;

  // Handle specific error types with appropriate responses
  
  // MongoDB Duplicate Key Error (E11000)
  if (err.code === 11000) {
    statusCode = 409; // Conflict
    message = 'Duplicate resource found';
    const field = Object.keys(err.keyPattern || {})[0];
    details = `${field} already exists in the system`;
  }
  
  // MongoDB Validation Error
  else if (err.name === 'ValidationError') {
    statusCode = 400; // Bad Request
    message = 'Validation failed';
    details = Object.values(err.errors || {}).map(e => e.message);
  }
  
  // MongoDB Cast Error (invalid ObjectId)
  else if (err.name === 'CastError') {
    statusCode = 400; // Bad Request
    message = 'Invalid resource ID format';
  }
  
  // JWT Errors
  else if (err.name === 'JsonWebTokenError') {
    statusCode = 401; // Unauthorized
    message = 'Invalid authentication token';
  }
  else if (err.name === 'TokenExpiredError') {
    statusCode = 401; // Unauthorized
    message = 'Authentication token expired';
  }
  
  // Custom business logic errors
  else if (err.message.includes('not found')) {
    statusCode = 404; // Not Found
  }
  else if (err.message.includes('unauthorized') || err.message.includes('permission')) {
    statusCode = 403; // Forbidden
  }

  // Don't leak internal error details in production
  if (statusCode === 500 && process.env.NODE_ENV === 'production') {
    message = 'Internal Server Error';
  }

  // Send structured error response
  res.status(statusCode).json({
    error: true,
    message,
    ...(details && { details }),
    ...(process.env.NODE_ENV !== 'production' && { 
      stack: err.stack 
    }),
    timestamp: new Date().toISOString()
  });
};

/**
 * Async Error Wrapper Utility
 * 
 * Wraps async route handlers to automatically catch promise rejections
 * and pass them to the global error handler.
 * 
 * @param fn - Async route handler function
 * @returns Wrapped function that handles async errors properly
 * 
 * @example
 * // Instead of try/catch in every route handler:
 * router.get('/route', asyncHandler(async (req, res) => { ... }));
 */
export const asyncHandler = (fn: Function) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

/**
 * 404 Not Found Middleware
 * 
 * Catches requests to undefined routes and returns consistent 404 response.
 * Should be placed after all valid routes but before the global error handler.
 */
export const notFoundHandler = (req: Request, res: Response): void => {
  res.status(404).json({
    error: true,
    message: `Route not found: ${req.method} ${req.originalUrl}`,
    timestamp: new Date().toISOString()
  });
};