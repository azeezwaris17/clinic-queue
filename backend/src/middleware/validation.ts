// backend/src/middleware/validation.ts
/**
 * Request Validation & Sanitization Middleware
 * 
 * Provides additional security by sanitizing user input and
 * validating request parameters to prevent injection attacks
 * and malformed data.
 */

import { Request, Response, NextFunction } from 'express';

/**
 * Sanitizes request body by trimming strings and removing script tags
 */
export const sanitizeInput = (req: Request, _res: Response, next: NextFunction): void => {
  const sanitize = (obj: any): any => {
    if (typeof obj === 'string') {
      // Trim and remove potential XSS vectors
      return obj.trim().replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
    }
    
    if (Array.isArray(obj)) {
      return obj.map(sanitize);
    }
    
    if (obj && typeof obj === 'object') {
      const sanitized: any = {};
      for (const [key, value] of Object.entries(obj)) {
        sanitized[key] = sanitize(value);
      }
      return sanitized;
    }
    
    return obj;
  };

  if (req.body) {
    req.body = sanitize(req.body);
  }
  
  if (req.query) {
    req.query = sanitize(req.query);
  }

  next();
};

/**
 * Validates MongoDB ObjectId in request parameters
 */
export const validateObjectId = (req: Request, res: Response, next: NextFunction): void => {
  const id = req.params.id;
  
  if (id && !id.match(/^[0-9a-fA-F]{24}$/)) {
    res.status(400).json({
      error: 'Invalid ID format',
      message: 'The provided ID is not a valid MongoDB ObjectId'
    });
    return;
  }
  
  next();
};

/**
 * Validates pagination parameters
 */
export const validatePagination = (req: Request, res: Response, next: NextFunction): void => {
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 20;
  
  if (page < 1 || limit < 1 || limit > 100) {
    res.status(400).json({
      error: 'Invalid pagination parameters',
      message: 'Page must be ≥ 1, limit must be between 1 and 100'
    });
    return;
  }
  
  next();
};

/**
 * Validates date range parameters
 */
export const validateDateRange = (req: Request, res: Response, next: NextFunction): void => {
  const { startDate, endDate } = req.query;
  
  if (startDate && isNaN(Date.parse(startDate as string))) {
    res.status(400).json({
      error: 'Invalid start date',
      message: 'Start date must be a valid ISO date string'
    });
    return;
  }
  
  if (endDate && isNaN(Date.parse(endDate as string))) {
    res.status(400).json({
      error: 'Invalid end date',
      message: 'End date must be a valid ISO date string'
    });
    return;
  }
  
  if (startDate && endDate && new Date(startDate as string) > new Date(endDate as string)) {
    res.status(400).json({
      error: 'Invalid date range',
      message: 'Start date must be before end date'
    });
    return;
  }
  
  next();
};