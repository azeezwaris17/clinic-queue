// backend/src/middleware/rateLimit.ts

import rateLimit from 'express-rate-limit';
import { Request } from 'express';

/**
 * Safe key generator that always returns a string
 * Uses express-rate-limit's built-in IP handling
 */
const safeKeyGenerator = (req: Request): string => {
  // Use the built-in IP from express-rate-limit's default behavior
  // This automatically handles IPv6 safely
  const ip = req.ip;
  
  const userContext = (req as any).user?.id ? `user-${(req as any).user.id}` : 'anonymous';
  const method = req.method;
  const path = req.path.split('?')[0];

  return `${ip}-${userContext}-${method}-${path}`;
};

/**
 * Simple strict IP-only generator for auth routes
 */
const simpleIpKey = (req: Request): string => {
  // Use the built-in IP handling which is IPv6 safe
  return req.ip || 'unknown-ip';
};

/**
 * Skip rate limits for tests & health check
 */
const skipRateLimit = (req: Request): boolean => {
  return req.path === '/api/health' || process.env.NODE_ENV === 'test';
};

/**
 * General limiter
 */
export const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: {
    success: false,
    error: 'Too many requests',
    message: 'Please try again later.',
    retryAfter: '15 minutes'
  },
  standardHeaders: true,
  legacyHeaders: false,
  skip: skipRateLimit,
  keyGenerator: safeKeyGenerator
});

/**
 * Authentication limiter
 */
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: {
    success: false,
    error: 'Too many authentication attempts',
    message: 'Please try again in 15 minutes.',
    retryAfter: '15 minutes'
  },
  standardHeaders: true,
  legacyHeaders: false,
  skip: skipRateLimit,
  keyGenerator: simpleIpKey
});

/**
 * Patient check-in limiter
 */
export const checkInLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 50,
  message: {
    success: false,
    error: 'Too many check-in requests',
    message: 'Please try again later.',
    retryAfter: '1 hour'
  },
  standardHeaders: true,
  legacyHeaders: false
});

/**
 * Admin limiter
 */
export const adminLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  message: {
    success: false,
    error: 'Too many admin requests',
    message: 'Please slow down your requests.',
    retryAfter: '15 minutes'
  },
  standardHeaders: true,
  legacyHeaders: false
});