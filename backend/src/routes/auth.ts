// backend/src/routes/auth.ts
/**
 * Authentication Routes
 * 
 * Defines Express routes for staff authentication and authorization.
 * Maps HTTP endpoints to controller functions with appropriate middleware.
 */

import express, { Router } from 'express';
import {
  login,
  register,
  verifyToken,
  logout,
  changePassword,
  registerAdmin,
  getSystemStatus
} from '../controllers/auth.controller';
import { authenticate, requireAdmin } from '../middleware';
import { validate } from '../utils/validation';
import Staff from '../models/Staff';

// Import validation schemas (to be created in shared schemas)
import { z } from 'zod';

/**
 * Zod schemas for request validation
 */
const LoginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required')
});

const RegisterSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  role: z.enum(['doctor', 'nurse', 'receptionist', 'admin']),
  phone: z.string().min(1, 'Phone number is required'),
  specialty: z.string().optional()
});

const RegisterAdminSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  phone: z.string().min(1, 'Phone number is required')
});

const ChangePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: z.string().min(6, 'New password must be at least 6 characters')
});

// Initialize Express router
const router: Router = express.Router();

/**
 * @route   GET /api/auth/system-status
 * @desc    Get system initialization status
 * @access  Public
 */
router.get('/system-status', getSystemStatus);

/**
 * @route   POST /api/auth/login
 * @desc    Authenticate staff member and return JWT token
 * @access  Public
 */
router.post('/login', validate(LoginSchema), login);

/**
 * @route   POST /api/auth/register  
 * @desc    Register a new staff member (first user becomes admin)
 * @access  Public (first user) / Private (subsequent users)
 */
router.post('/register', validate(RegisterSchema), register);

/**
 * @route   POST /api/auth/register-admin
 * @desc    Register a new admin (admin only)
 * @access  Private (Admin only)
 */
router.post('/register-admin', authenticate, requireAdmin, validate(RegisterAdminSchema), registerAdmin);

/**
 * @route   POST /api/auth/verify
 * @desc    Verify JWT token validity
 * @access  Private
 */
router.post('/verify', authenticate, verifyToken);

/**
 * @route   POST /api/auth/logout
 * @desc    Logout staff member (client-side token invalidation)
 * @access  Private
 */
router.post('/logout', authenticate, logout);

/**
 * @route   PATCH /api/auth/change-password
 * @desc    Change staff member's password
 * @access  Private
 */
router.patch('/change-password', authenticate, validate(ChangePasswordSchema), changePassword);

/**
 * @route   GET /api/auth/admin/stats
 * @desc    Get admin dashboard statistics
 * @access  Private (Admin only)
 */
router.get('/admin/stats', authenticate, requireAdmin, async (_req, res) => {
  try {
    const staffCount = await Staff.countDocuments({ isActive: true });
    const adminCount = await Staff.countDocuments({ role: 'admin', isActive: true });
    
    const roles = await Staff.aggregate([
      { $match: { isActive: true } },
      { $group: { _id: '$role', count: { $sum: 1 } } }
    ]);

    res.json({
      success: true,
      data: {
        totalStaff: staffCount,
        totalAdmins: adminCount,
        roles: roles
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to fetch admin stats'
    });
  }
});

export default router;