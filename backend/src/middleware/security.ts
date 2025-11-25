// backend/src/middleware/security.ts (Enhanced)
/**
 * Enhanced Security Headers Middleware
 * 
 * Provides comprehensive security headers to protect against
 * common web vulnerabilities and enforce security best practices.
 */

import { Request, Response, NextFunction } from 'express';
import helmet from 'helmet';

/**
 * Comprehensive security headers using Helmet
 */
export const securityHeaders = helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'"],
      fontSrc: ["'self'"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"]
    }
  },
  crossOriginEmbedderPolicy: false, // Disabled for API
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  }
});

/**
 * Custom CORS configuration for healthcare application
 */
export const corsHeaders = (req: Request, res: Response, next: NextFunction): void => {
  const allowedOrigins = (process.env.ALLOWED_ORIGINS || 'http://localhost:3000').split(',');
  const origin = req.headers.origin;
  
  // Allow requests from whitelisted origins
  if (origin && allowedOrigins.includes(origin)) {
    res.header('Access-Control-Allow-Origin', origin);
  }
  
  res.header('Access-Control-Allow-Credentials', 'true');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 
    'Content-Type, Authorization, X-Requested-With, x-auth-token, x-request-id'
  );
  res.header('Access-Control-Expose-Headers', 'x-request-id, x-response-time');
  res.header('X-Request-ID', (req as any).requestId);
  
  // Handle preflight OPTIONS requests
  if (req.method === 'OPTIONS') {
    res.header('Access-Control-Max-Age', '86400'); // 24 hours
    res.sendStatus(200);
    return;
  }
  
  next();
};

/**
 * Additional security headers not covered by Helmet
 */
export const additionalSecurityHeaders = (_req: Request, res: Response, next: NextFunction): void => {
  // Prevent MIME type sniffing
  res.header('X-Content-Type-Options', 'nosniff');
  
  // Enable XSS protection in older browsers
  res.header('X-XSS-Protection', '1; mode=block');
  
  // Prevent clickjacking attacks
  res.header('X-Frame-Options', 'DENY');
  
  // Control referrer information
  res.header('Referrer-Policy', 'strict-origin-when-cross-origin');
  
  // Feature policy (now Permissions Policy)
  res.header('Permissions-Policy', 
    'camera=(), microphone=(), geolocation=(), payment=()'
  );
  
  // Remove server information
  res.header('X-Powered-By', 'ClinicQueue API');
  
  next();
};