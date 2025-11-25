// backend/src/routes/visits.ts
/**
 * Visit Management Routes
 * 
 * Defines Express routes for patient visit operations including
 * check-in, retrieval, and management. Includes both public and
 * protected endpoints.
 */

import express, { Router } from 'express';
import {
  checkIn,
  getVisitById,
  getPatientVisits,
  updateVisit,
  getVisitStatistics
} from '../controllers/visits.controller';
import { authenticate, } from '../middleware';
import { validate } from '../utils/validation';

// Import validation schemas (to be created in shared schemas)
import { z } from 'zod';

/**
 * Zod schemas for visit request validation
 */
const CheckInSchema = z.object({
  firstName: z.string().min(1, 'First name is required').max(50, 'First name too long'),
  lastName: z.string().min(1, 'Last name is required').max(50, 'Last name too long'),
  email: z.string().email('Invalid email address'),
  phone: z.string().min(1, 'Phone number is required'),
  dateOfBirth: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format'),
  gender: z.enum(['male', 'female', 'other']),
  symptoms: z.string().min(5, 'Symptoms description must be at least 5 characters'),
  temperature: z.number().min(90).max(110),
  heartRate: z.number().min(30).max(200),
  bloodPressureSystolic: z.number().min(70).max(250),
  bloodPressureDiastolic: z.number().min(40).max(150),
  painLevel: z.number().min(0).max(10),
  allergies: z.string().optional(),
  medications: z.string().optional()
});

const UpdateVisitSchema = z.object({
  notes: z.string().max(1000, 'Notes too long').optional(),
  completedAt: z.string().datetime('Invalid date format').optional()
});

// Initialize Express router
const router: Router = express.Router();

/**
 * Public Routes - No authentication required
 */

/**
 * @route   POST /api/visits/check-in
 * @desc    Process patient check-in with triage scoring
 * @access  Public
 */
router.post('/check-in', validate(CheckInSchema), checkIn);

/**
 * @route   GET /api/visits/:id
 * @desc    Get visit details by ID
 * @access  Public (consider what data should be publicly accessible)
 */
router.get('/:id', getVisitById);

/**
 * Protected Routes - Require authentication
 */

/**
 * @route   GET /api/visits/patient/:patientId
 * @desc    Get visit history for a patient
 * @access  Private (staff only)
 */
router.get('/patient/:patientId', authenticate, getPatientVisits);

/**
 * @route   PATCH /api/visits/:id
 * @desc    Update visit information (notes, completion status)
 * @access  Private (staff only)
 */
router.patch('/:id', authenticate, validate(UpdateVisitSchema), updateVisit);

/**
 * @route   GET /api/visits/stats/overview
 * @desc    Get visit statistics for dashboard
 * @access  Private (staff only)
 */
router.get('/stats/overview', authenticate, getVisitStatistics);

export default router;