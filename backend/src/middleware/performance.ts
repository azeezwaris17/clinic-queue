// backend/src/middleware/performance.ts
/**
 * Compression & Performance Optimization Middleware
 * 
 * Improves API performance through response compression,
 * caching headers, and other optimization techniques.
 */

import compression, { CompressionFilter } from 'compression';
import { Request, Response, NextFunction } from 'express';

/**
 * Response compression middleware
 */
const filter: CompressionFilter = (req, res) => {
  // Skip if header set
  if (req.headers['x-no-compression']) return false;

  const contentType = res.getHeader('Content-Type');
  if (!contentType) return true;

  const compressibleTypes = [
    'text/plain',
    'text/html',
    'text/css',
    'application/javascript',
    'application/json',
    'application/xml',
    'text/xml',
  ];

  return compressibleTypes.some(type => String(contentType).includes(type));
};

export const compressResponses = () => {
  return compression({
    level: 6,
    threshold: 1024,
    filter,
  });
};

export const responseTime = (req: Request, res: Response, next: NextFunction) => {
  const start = Date.now();
  
  // Only add listeners if we haven't already sent headers
  res.on('finish', () => {
    const duration = Date.now() - start;
    console.log(`⏱️  Response time: ${duration}ms for ${req.method} ${req.path}`);
  });

  next();
};

/**
 * Cache control middleware
 */
export const cacheControl = (req: Request, res: Response, next: NextFunction) => {
  // Skip cache control for Swagger UI assets and API docs
  if (req.path.startsWith('/api-docs') || req.path.includes('swagger-ui')) {
    return next();
  }

  // Skip cache control for static files that are already handled
  if (req.path.includes('.') && !req.path.includes('/api/')) {
    return next();
  }

  // Set cache headers for API responses
  res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
  
  next();
};