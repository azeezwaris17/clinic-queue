// backend/src/middleware/index.ts
/**
 * Complete Middleware Export Index
 */

// Authentication & Authorization
export { 
  authenticate, 
  authorize, 
  optionalAuth, 
  requireAdmin, 
  requireRole, 
  requireStaffManagement, 
  requireMedicalStaff 
} from './auth';

// Error Handling
export { errorHandler, asyncHandler, notFoundHandler } from './errorHandler';

// Security
export { 
  securityHeaders, 
  corsHeaders, 
  additionalSecurityHeaders 
} from './security';

// Rate Limiting
export {
  generalLimiter,
  authLimiter,
  checkInLimiter,
  adminLimiter
} from './rateLimit';

// Validation & Sanitization
export {
  sanitizeInput,
  validateObjectId,
  validatePagination,
  validateDateRange
} from './validation';

// Logging & Monitoring
export {
  enhancedLogger,
  auditLogger,
  performanceMonitor
} from './logging';

// Performance & Compression
export {
  compressResponses,
  cacheControl,
  responseTime
} from './performance';