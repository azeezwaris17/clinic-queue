// backend/src/routes/queue.ts
/**
 * Queue Management Routes
 * 
 * Handles real-time queue operations including patient status updates,
 * queue position management, and queue analytics for staff dashboard.
 */

import express, { Router } from 'express';
import {
  getQueue,
  getQueueStats,
  updateQueueStatus,
  callNextPatient,
  getCurrentQueue,
  recalculatePositions
} from '../controllers/queue.controller';
import { authenticate, authorize } from '../middleware';
import { validate } from '../utils/validation';
import { z } from 'zod';

/**
 * Validation Schemas for Queue Routes
 */
const UpdateQueueStatusSchema = z.object({
  status: z.enum(['waiting', 'in-progress', 'completed', 'cancelled']),
  doctorId: z.string().optional(),
  assignedRoom: z.string().max(20).optional(),
  notes: z.string().max(1000).optional()
});

const CallNextPatientSchema = z.object({
  doctorId: z.string().min(1, 'Doctor ID is required'),
  assignedRoom: z.string().max(20).optional()
});

const router: Router = express.Router();

/**
 * @route   GET /api/queue
 * @desc    Get current queue with patient details
 * @access  Private (Staff only)
 */
router.get('/', authenticate, getQueue);

/**
 * @route   GET /api/queue/current
 * @desc    Get optimized current queue (for display)
 * @access  Private (Staff only)
 */
router.get('/current', authenticate, getCurrentQueue);

/**
 * @route   GET /api/queue/stats
 * @desc    Get queue statistics for dashboard
 * @access  Private (Staff only)
 */
router.get('/stats', authenticate, getQueueStats);

/**
 * @route   PATCH /api/queue/:id
 * @desc    Update queue entry status
 * @access  Private (Staff only)
 */
router.patch('/:id', authenticate, validate(UpdateQueueStatusSchema), updateQueueStatus);

/**
 * @route   POST /api/queue/call-next
 * @desc    Call next patient for consultation
 * @access  Private (Doctor only)
 */
router.post('/call-next', authenticate, authorize('doctor', 'nurse'), validate(CallNextPatientSchema), callNextPatient);

/**
 * @route   POST /api/queue/recalculate
 * @desc    Recalculate queue positions (admin function)
 * @access  Private (Admin only)
 */
router.post('/recalculate', authenticate, authorize('admin'), recalculatePositions);

export default router;