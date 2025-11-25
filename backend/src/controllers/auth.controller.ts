// backend/src/controllers/auth.controller.ts
/**
 * Authentication Controller
 * 
 * Handles HTTP requests for staff authentication including login,
 * registration, token verification, and password management.
 * Validates inputs and delegates business logic to AuthService.
 */

import { Request, Response, NextFunction } from 'express';
import { AuthService } from '../services/auth.service';
import { asyncHandler } from '../middleware';
import { hasExistingAdmin, getAdminStats } from '../utils/adminSetup';

/**
 * Handles staff login requests
 * 
 * @route POST /api/auth/login
 * @access Public
 * @param req - Express request with email and password in body
 * @param res - Express response with token and staff data
 * @param next - Express next function for error handling
 * 
 * @example
 * // Request body:
 * {
 *   "email": "doctor@clinic.com",
 *   "password": "securePassword123"
 * }
 * 
 * // Response:
 * {
 *   "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
 *   "staff": {
 *     "id": "507f1f77bcf86cd799439011",
 *     "firstName": "Emily",
 *     "lastName": "Carter", 
 *     "email": "doctor@clinic.com",
 *     "role": "doctor",
 *     "specialty": "Cardiology"
 *   }
 * }
 */
export const login = asyncHandler(async (req: Request, res: Response, _next: NextFunction) => {
  const { email, password } = req.body;

  // Validate required fields
  if (!email || !password) {
    res.status(400).json({
      error: 'Missing required fields',
      message: 'Email and password are required'
    });
    return;
  }

  // Process login through AuthService
  const result = await AuthService.login({ email, password });

  // Return successful authentication response
  res.status(200).json({
    success: true,
    message: 'Login successful',
    ...result
  });
});

/**
 * Handles staff registration requests with admin auto-creation
 * First registrant automatically becomes admin
 * Subsequent registrations require admin approval
 * 
 * @route POST /api/auth/register  
 * @access Public (first user) / Private (subsequent users)
 * @param req - Express request with staff registration data
 * @param res - Express response with token and staff data
 * 
 * @example
 * // Request body:
 * {
 *   "email": "nurse@clinic.com",
 *   "password": "securePassword123", 
 *   "firstName": "Sarah",
 *   "lastName": "Johnson",
 *   "role": "nurse",
 *   "phone": "5551234567"
 * }
 */
export const register = asyncHandler(async (req: Request, res: Response) => {
  const { email, password, firstName, lastName, role, phone, specialty } = req.body;

  // Validate required fields
  if (!email || !password || !firstName || !lastName || !role || !phone) {
    res.status(400).json({
      error: 'Missing required fields',
      message: 'Email, password, firstName, lastName, role, and phone are required'
    });
    return;
  }

  try {
    // Check if this is the first registration
    const adminExists = await hasExistingAdmin();
    
    let result;
    if (!adminExists) {
      // First registration - auto-create admin
      console.log('🆕 First staff registration - creating system admin');
      result = await AuthService.registerFirstStaff({
        email, password, firstName, lastName, role, phone, specialty
      });
    } else {
      // Subsequent registrations - normal flow
      result = await AuthService.register({
        email, password, firstName, lastName, role, phone, specialty
      });
    }

    // Return successful registration response
    res.status(201).json({
      success: true,
      message: 'Staff registration successful',
      ...result
    });
    
  } catch (error: any) {
    res.status(400).json({
      success: false,
      error: 'Registration failed',
      message: error.message
    });
  }
});

/**
 * Admin-only endpoint to register new admins
 * 
 * @route POST /api/auth/register-admin
 * @access Private (Admin only)
 * @param req - Express request with admin registration data
 * @param res - Express response with token and admin data
 */
export const registerAdmin = asyncHandler(async (req: Request, res: Response) => {
  const { email, password, firstName, lastName, phone } = req.body;
  const requestingAdminId = req.user?.id;

  if (!requestingAdminId) {
    res.status(401).json({
      error: 'Authentication required',
      message: 'Admin authentication required'
    });
    return;
  }

  // Validate required fields
  if (!email || !password || !firstName || !lastName || !phone) {
    res.status(400).json({
      error: 'Missing required fields',
      message: 'Email, password, firstName, lastName, and phone are required'
    });
    return;
  }

  try {
    const result = await AuthService.registerAdmin({
      email,
      password,
      firstName,
      lastName,
      role: 'admin', // Force admin role
      phone
    }, requestingAdminId);

    res.status(201).json({
      success: true,
      message: 'Admin registration successful',
      ...result
    });
    
  } catch (error: any) {
    res.status(403).json({
      success: false,
      error: 'Admin registration failed',
      message: error.message
    });
  }
});

/**
 * Get system admin status (public endpoint)
 * 
 * @route GET /api/auth/system-status
 * @access Public
 * @param req - Express request
 * @param res - Express response with system status
 */
export const getSystemStatus = asyncHandler(async (_req: Request, res: Response) => {
  const stats = await getAdminStats();
  
  res.status(200).json({
    success: true,
    data: {
      ...stats,
      systemReady: stats.hasAdmin
    }
  });
});

/**
 * Verifies JWT token validity
 * 
 * @route POST /api/auth/verify
 * @access Private (requires valid token)
 * @param req - Express request with JWT token in Authorization header
 * @param res - Express response with token validity and user data
 */
export const verifyToken = asyncHandler(async (req: Request, res: Response) => {
  // If middleware passed, token is valid and user is attached to request
  res.status(200).json({
    success: true,
    message: 'Token is valid',
    valid: true,
    user: req.user
  });
});

/**
 * Handles staff logout (client-side token invalidation)
 * 
 * @route POST /api/auth/logout
 * @access Private (requires valid token)
 * @param req - Express request
 * @param res - Express response with logout confirmation
 * 
 * @note In a production system with server-side sessions, this would
 * invalidate the token on the server. Currently relies on client-side
 * token removal.
 */
export const logout = asyncHandler(async ( res: Response) => {
  res.status(200).json({
    success: true,
    message: 'Logout successful. Please remove the token from client storage.'
  });
});

/**
 * Changes staff member's password
 * 
 * @route PATCH /api/auth/change-password
 * @access Private (requires valid token)
 * @param req - Express request with current and new password
 * @param res - Express response with success confirmation
 */
export const changePassword = asyncHandler(async (req: Request, res: Response) => {
  const { currentPassword, newPassword } = req.body;
  const staffId = req.user?.id;

  if (!staffId) {
    res.status(401).json({
      error: 'Authentication required',
      message: 'Staff ID not found in token'
    });
    return;
  }

  if (!currentPassword || !newPassword) {
    res.status(400).json({
      error: 'Missing required fields',
      message: 'Current password and new password are required'
    });
    return;
  }

  // Process password change through AuthService
  await AuthService.changePassword(staffId, currentPassword, newPassword);

  res.status(200).json({
    success: true,
    message: 'Password changed successfully'
  });
});