// src/tests/unit/validation.test.ts
/**
 * Validation Utility Tests
 * 
 * Tests Zod schema validation and custom validation utilities
 * used for request data validation.
 */

import { describe, beforeEach, test, expect, jest } from '@jest/globals';
import { validate, formatValidationError, commonValidators } from '../../utils/validation';
import { z } from 'zod';

// Mock Express objects
const mockRequest = (body: any) => ({
  body
});

const mockResponse = () => {
  const res: any = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

const mockNext = jest.fn();

describe('Validation Utilities', () => {
  describe('validate middleware', () => {
    const TestSchema = z.object({
      name: z.string().min(1, 'Name is required'),
      email: z.string().email('Invalid email'),
      age: z.number().min(0, 'Age must be positive')
    });

    beforeEach(() => {
      mockNext.mockClear();
    });

    test('should pass validation for valid data', async () => {
      const req = mockRequest({
        name: 'John Doe',
        email: 'john@example.com',
        age: 30
      });
      const res = mockResponse();

      const middleware = validate(TestSchema);
      await middleware(req as any, res as any, mockNext);

      expect(mockNext).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
      expect(req.body).toEqual({
        name: 'John Doe',
        email: 'john@example.com',
        age: 30
      });
    });

    test('should reject invalid data with 400 status', async () => {
      const req = mockRequest({
        name: '',
        email: 'invalid-email',
        age: -5
      });
      const res = mockResponse();

      const middleware = validate(TestSchema);
      await middleware(req as any, res as any, mockNext);

      expect(mockNext).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(400);
    });
  });
});