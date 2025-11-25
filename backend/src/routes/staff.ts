// backend/src/routes/staff.ts
/**
 * Staff Management Routes
 * 
 * Handles staff member operations including profile management,
 * role-based access, and staff directory functionality.
 */

import express, { Router } from 'express';
import {
  getStaff,
  getStaffById,
  getCurrentStaff,
  updateStaffProfile,
  getDoctors,
  deactivateStaff
} from '../controllers/staff.controller';
import { authenticate, authorize } from '../middleware';
import { validate } from '../utils/validation';
import { z } from 'zod';

/**
 * Validation Schemas for Staff Routes
 */
const UpdateStaffSchema = z.object({
  firstName: z.string().min(1).max(50).optional(),
  lastName: z.string().min(1).max(50).optional(),
  phone: z.string().min(1).optional(),
  specialty: z.string().max(100).optional(),
  isActive: z.boolean().optional()
});

const router: Router = express.Router();

/**
 * @route   GET /api/staff
 * @desc    Get all staff members (Admin only)
 * @access  Private (Admin only)
 */
router.get('/', authenticate, authorize('admin'), getStaff);

/**
 * @route   GET /api/staff/doctors
 * @desc    Get all doctors for appointment scheduling
 * @access  Private (Staff only)
 */
router.get('/doctors', authenticate, getDoctors);

/**
 * @route   GET /api/staff/me
 * @desc    Get current staff member profile
 * @access  Private (Staff only)
 */
router.get('/me', authenticate, getCurrentStaff);

/**
 * @route   GET /api/staff/:id
 * @desc    Get staff member by ID
 * @access  Private (Admin only)
 */
router.get('/:id', authenticate, authorize('admin'), getStaffById);

/**
 * @route   PATCH /api/staff/me
 * @desc    Update current staff profile
 * @access  Private (Staff only)
 */
router.patch('/me', authenticate, validate(UpdateStaffSchema), updateStaffProfile);

/**
 * @route   PATCH /api/staff/:id
 * @desc    Update staff member (Admin only)
 * @access  Private (Admin only)
 */
router.patch('/:id', authenticate, authorize('admin'), validate(UpdateStaffSchema), updateStaffProfile);

/**
 * @route   DELETE /api/staff/:id
 * @desc    Deactivate staff member
 * @access  Private (Admin only)
 */
router.delete('/:id', authenticate, authorize('admin'), deactivateStaff);

export default router;