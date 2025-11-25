// backend/src/middleware/logging.ts
/**
 * Advanced Logging & Monitoring Middleware
 * 
 * Provides comprehensive request/response logging, performance monitoring,
 * and audit trails for security and debugging purposes.
 */


import { Request, Response, NextFunction } from 'express';



/**
 * Enhanced request logger with performance metrics
 */
export const enhancedLogger = (req: Request, res: Response, next: NextFunction): void => {
  const startTime = Date.now();
  const requestId = generateRequestId();
  
  // Add request ID to request object for tracking
  req.requestId = requestId;
  
  // Log request details
  console.log(`[${new Date().toISOString()}] 📥 INCOMING REQUEST:`, {
    requestId,
    method: req.method,
    path: req.path,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    userId: (req as any).user?.id || 'anonymous'
  });
  
  // Monitor response when request completes
  res.on('finish', () => {
    const duration = Date.now() - startTime;
    const logLevel = res.statusCode >= 400 ? 'warn' : 'info';
    
    console[logLevel](`[${new Date().toISOString()}] 📤 REQUEST COMPLETED:`, {
      requestId,
      method: req.method,
      path: req.path,
      status: res.statusCode,
      duration: `${duration}ms`,
      userId: (req as any).user?.id || 'anonymous',
      contentLength: res.get('Content-Length') || '0'
    });
    
    // Log slow requests
    if (duration > 1000) { // More than 1 second
      console.warn(`[${new Date().toISOString()}] ⚠️ SLOW REQUEST:`, {
        requestId,
        method: req.method,
        path: req.path,
        duration: `${duration}ms`,
        threshold: '1000ms'
      });
    }
  });
  
  next();
};

/**
 * Audit logger for sensitive operations
 */
export const auditLogger = (req: Request, _res: Response, next: NextFunction): void => {
  const sensitiveEndpoints = [
    '/api/auth/login',
    '/api/auth/register',
    '/api/patients',
    '/api/appointments',
    '/api/staff'
  ];
  
  const isSensitiveEndpoint = sensitiveEndpoints.some(endpoint => 
    req.path.startsWith(endpoint)
  );
  
  if (isSensitiveEndpoint) {
    const auditLog = {
      timestamp: new Date().toISOString(),
      requestId: req.requestId,
      userId: (req as any).user?.id || 'anonymous',
      action: `${req.method} ${req.path}`,
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      body: redactSensitiveData(req.body)
    };
    
    // In production, this would go to a dedicated audit log system
    console.log(`[AUDIT] ${JSON.stringify(auditLog)}`);
  }
  
  next();
};

/**
 * Performance monitoring middleware
 */
export const performanceMonitor = (req: Request, res: Response, next: NextFunction): void => {
  const startMemory = process.memoryUsage();
  const startTime = process.hrtime();
  
  res.on('finish', () => {
    const [seconds, nanoseconds] = process.hrtime(startTime);
    const duration = seconds * 1000 + nanoseconds / 1000000; // Convert to milliseconds
    const endMemory = process.memoryUsage();
    
    const memoryDiff = {
      rss: (endMemory.rss - startMemory.rss) / 1024 / 1024, // MB
      heapTotal: (endMemory.heapTotal - startMemory.heapTotal) / 1024 / 1024, // MB
      heapUsed: (endMemory.heapUsed - startMemory.heapUsed) / 1024 / 1024, // MB
      external: (endMemory.external - startMemory.external) / 1024 / 1024 // MB
    };
    
    // Log performance metrics for slow requests or high memory usage
    if (duration > 500 || memoryDiff.heapUsed > 10) {
      console.warn(`[PERFORMANCE] ${req.method} ${req.path}`, {
        requestId: req.requestId,
        duration: `${duration.toFixed(2)}ms`,
        memoryUsage: memoryDiff,
        timestamp: new Date().toISOString()
      });
    }
  });
  
  next();
};

/**
 * Helper function to generate unique request ID
 */
function generateRequestId(): string {
  return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Helper function to redact sensitive data from logs
 */
function redactSensitiveData(data: any): any {
  if (typeof data !== 'object' || data === null) {
    return data;
  }
  
  const sensitiveFields = [
    'password', 'token', 'authorization', 'email', 'phone', 
    'ssn', 'creditCard', 'cvv', 'insuranceId'
  ];
  
  const redacted = { ...data };
  
  for (const field of sensitiveFields) {
    if (redacted[field]) {
      redacted[field] = '***REDACTED***';
    }
  }
  
  return redacted;
}