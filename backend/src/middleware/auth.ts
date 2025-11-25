// backend/src/middleware/auth.ts
/**
 * Authentication & Authorization Middleware
 * 
 * Provides JWT-based authentication and role-based authorization
 * for protecting API routes. Validates tokens, extracts user information,
 * and enforces access control based on staff roles.
 */

import { Request, Response, NextFunction } from 'express';
import { verifyToken } from '../utils/jwt';

/**
 * Extended Express Request interface to include user payload
 * This adds type safety for accessing user information in protected routes
 */
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        email: string;
        role: string;
        iat?: number;
        exp?: number;
      };
      staffId?: string;
    }
  }
}

/**
 * Authentication Middleware
 * 
 * Validates JWT tokens from Authorization header and attaches
 * user information to the request object for use in route handlers.
 * 
 * @throws {401} If no token provided or token is invalid/expired
 * @throws {500} If token verification fails unexpectedly
 */
export const authenticate = (req: Request, res: Response, next: NextFunction): void => {
  try {
    // Extract token from Authorization header (format: "Bearer <token>")
    const authHeader = req.headers.authorization;
    
    if (!authHeader?.startsWith('Bearer ')) {
      res.status(401).json({ 
        error: 'Authentication required',
        message: 'No authentication token provided'
      });
      return;
    }

    // Extract the token (remove "Bearer " prefix)
    const token = authHeader.slice(7);
    
    if (!token) {
      res.status(401).json({ 
        error: 'Invalid token format',
        message: 'Token must be provided after Bearer prefix'
      });
      return;
    }

    // Verify token validity and decode payload
    const decoded = verifyToken(token);
    
    if (!decoded) {
      res.status(401).json({ 
        error: 'Invalid or expired token',
        message: 'Please log in again'
      });
      return;
    }

    // Attach user information to request for use in route handlers
    req.user = decoded as any;
    req.staffId = decoded.id;
    
    // Continue to the next middleware or route handler
    next();
    
  } catch (error) {
    console.error('🔐 Authentication error:', error);
    
    res.status(500).json({ 
      error: 'Authentication system error',
      message: 'Unable to process authentication request'
    });
  }
};

/**
 * Role-Based Authorization Middleware Factory
 * 
 * Creates middleware that restricts access to users with specific roles.
 * Must be used after authenticate middleware.
 * 
 * @param roles - Array of allowed roles
 * @returns Middleware function that checks user roles
 * 
 * @throws {403} If user doesn't have required role
 * @example
 * // Only doctors and admins can access
 * router.get('/sensitive-data', authorize('doctor', 'admin'), handler);
 */
export const authorize = (...roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    // Ensure user is authenticated first
    if (!req.user) {
      res.status(401).json({ 
        error: 'Authentication required',
        message: 'User must be authenticated before authorization check'
      });
      return;
    }

    // Check if user's role is in the allowed roles list
    if (!roles.includes(req.user.role)) {
      res.status(403).json({ 
        error: 'Insufficient permissions',
        message: `Access denied. Required roles: ${roles.join(', ')}`,
        userRole: req.user.role
      });
      return;
    }

    // User has required role, continue to route handler
    next();
  };
};

/**
 * Check if user has any of the required roles
 * 
 * @param roles - Array of allowed roles
 * @returns Middleware function that checks user roles
 */
export const requireRole = (roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ 
        error: 'Authentication required',
        message: 'User must be authenticated'
      });
      return;
    }

    if (!roles.includes(req.user.role)) {
      res.status(403).json({ 
        error: 'Insufficient permissions',
        message: `Required roles: ${roles.join(', ')}`,
        userRole: req.user.role
      });
      return;
    }

    next();
  };
};

/**
 * Admin-only middleware (convenience wrapper)
 */
export const requireAdmin = requireRole(['admin']);

/**
 * Staff management middleware (admin + specific roles)
 */
export const requireStaffManagement = requireRole(['admin', 'receptionist']);

/**
 * Medical staff middleware (doctors + nurses + admin)
 */
export const requireMedicalStaff = requireRole(['admin', 'doctor', 'nurse']);

/**
 * Optional Authentication Middleware
 * 
 * Similar to authenticate but doesn't block requests if no token provided.
 * Attaches user info if token is valid, but allows public access otherwise.
 * Useful for routes that have different behavior for authenticated vs public users.
 */
export const optionalAuth = (req: Request, _res: Response, next: NextFunction): void => {
  try {
    const authHeader = req.headers.authorization;
    
    if (authHeader?.startsWith('Bearer ')) {
      const token = authHeader.slice(7);
      const decoded = verifyToken(token);
      
      if (decoded) {
        req.user = decoded as any;
        req.staffId = decoded.id;
      }
    }
    
    next();
  } catch (error) {
    // Log error but don't block the request for optional auth
    console.warn('⚠️ Optional authentication failed:', error);
    next();
  }
};