// backend/src/utils/validation.ts
/**
 * Request Validation Utility
 * 
 * Provides Zod schema validation middleware for Express requests.
 * Ensures incoming data meets expected formats and business rules
 * before processing in route handlers.
 */

import { Request, Response, NextFunction } from 'express';
import { ZodSchema, ZodError, z } from 'zod';

/**
 * Validation Middleware Factory
 * 
 * Creates Express middleware that validates request data against a Zod schema.
 * Automatically handles validation errors and returns structured error responses.
 * 
 * @param schema - Zod schema to validate against
 * @param target - Which part of the request to validate ('body', 'query', 'params')
 * @returns Express middleware function
 * 
 * @example
 * // Validate request body
 * router.post('/patients', validate(PatientSchema), createPatient);
 * 
 * @example  
 * // Validate query parameters
 * router.get('/patients', validate(PatientQuerySchema, 'query'), getPatients);
 */
export const validate = (
  schema: ZodSchema, 
  target: 'body' | 'query' | 'params' = 'body'
) => {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      // Get data from specified request target
      const data = req[target];
      
      // Validate data against schema
      const parsedData = await schema.parseAsync(data);
      
      // Replace request data with validated and parsed data
      req[target] = parsedData;
      
      // Continue to next middleware/route handler
      next();
      
    } catch (error) {
      // Handle Zod validation errors
      if (error instanceof ZodError) {
        const validationErrors = error.errors.map((err) => ({
          field: err.path.join('.'),
          message: err.message,
          code: err.code
        }));

        // Return structured validation error response
        res.status(400).json({
          error: 'Validation failed',
          message: 'Request data did not pass validation',
          details: validationErrors,
          timestamp: new Date().toISOString()
        });
        return;
      }

      // Pass other errors to global error handler
      next(error);
    }
  };
};

/**
 * Custom validation error formatter for consistent error responses
 */
export const formatValidationError = (error: ZodError) => {
  return {
    error: 'VALIDATION_ERROR',
    message: 'One or more validation errors occurred',
    details: error.errors.map(err => ({
      field: err.path.join('.'),
      message: err.message,
      code: err.code
    }))
  };
};

/**
 * Utility to create reusable validation schemas for common patterns
 */
export const commonValidators = {
  // MongoDB ObjectId validation
  objectId: () => z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid ID format'),
  
  // Email validation
  email: () => z.string().email('Invalid email address').toLowerCase().trim(),
  
  // Phone number validation (basic)
  phone: () => z.string().min(10, 'Phone number too short').max(15, 'Phone number too long'),
  
  // Date string validation
  dateString: () => z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format'),
  
  // Positive number validation
  positiveNumber: () => z.number().min(0, 'Must be a positive number'),
  
  // Enum validation with custom error message
  enum: <T extends [string, ...string[]]>(values: T, errorMessage?: string) => 
    z.string().refine((val: string) => values.includes(val as T[0]), {
      message: errorMessage || `Must be one of: ${values.join(', ')}`
    })
};

// Re-export Zod for convenience
export { z } from 'zod';