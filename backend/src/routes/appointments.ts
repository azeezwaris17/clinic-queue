// backend/src/routes/appointments.ts
/**
 * Appointment Management Routes
 * 
 * Handles scheduling, updating, and managing patient appointments
 * with healthcare providers. Includes conflict detection and
 * appointment lifecycle management.
 */

import express, { Router } from 'express';
import {
  getAppointments,
  getAppointmentById,
  createAppointment,
  updateAppointment,
  cancelAppointment,
  getDoctorAppointments,
  checkAvailability
} from '../controllers/appointments.controller';
import { authenticate, } from '../middleware';
import { validate } from '../utils/validation';
import { z } from 'zod';

/**
 * Validation Schemas for Appointment Routes
 */
const CreateAppointmentSchema = z.object({
  patientId: z.string().min(1, 'Patient ID is required'),
  doctorId: z.string().min(1, 'Doctor ID is required'),
  scheduledTime: z.string().datetime('Invalid date format'),
  duration: z.number().min(5).max(240).default(30),
  reasonForVisit: z.string().min(1, 'Reason for visit is required').max(500),
  appointmentType: z.enum(['checkup', 'follow-up', 'consultation', 'procedure', 'emergency']),
  chiefComplaint: z.string().max(1000).optional(),
  notes: z.string().max(2000).optional(),
  preAppointmentInstructions: z.string().max(1000).optional()
});

const UpdateAppointmentSchema = CreateAppointmentSchema.partial();

const GetAppointmentsSchema = z.object({
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  status: z.string().optional(),
  doctorId: z.string().optional(),
  page: z.string().optional().default('1'),
  limit: z.string().optional().default('20')
});

const CheckAvailabilitySchema = z.object({
  doctorId: z.string().min(1, 'Doctor ID is required'),
  startTime: z.string().datetime('Invalid start time format'),
  duration: z.number().min(5).max(240).default(30)
});

const router: Router = express.Router();

/**
 * @route   GET /api/appointments
 * @desc    Get paginated list of appointments with filtering
 * @access  Private (Staff only)
 */
router.get('/', authenticate, validate(GetAppointmentsSchema, 'query'), getAppointments);

/**
 * @route   GET /api/appointments/availability
 * @desc    Check doctor availability for scheduling
 * @access  Private (Staff only)
 */
router.get('/availability', authenticate, validate(CheckAvailabilitySchema, 'query'), checkAvailability);

/**
 * @route   GET /api/appointments/doctor/:doctorId
 * @desc    Get appointments for specific doctor
 * @access  Private (Staff only)
 */
router.get('/doctor/:doctorId', authenticate, getDoctorAppointments);

/**
 * @route   GET /api/appointments/:id
 * @desc    Get appointment by ID
 * @access  Private (Staff only)
 */
router.get('/:id', authenticate, getAppointmentById);

/**
 * @route   POST /api/appointments
 * @desc    Create new appointment
 * @access  Private (Staff only)
 */
router.post('/', authenticate, validate(CreateAppointmentSchema), createAppointment);

/**
 * @route   PATCH /api/appointments/:id
 * @desc    Update appointment details
 * @access  Private (Staff only)
 */
router.patch('/:id', authenticate, validate(UpdateAppointmentSchema), updateAppointment);

/**
 * @route   DELETE /api/appointments/:id
 * @desc    Cancel appointment
 * @access  Private (Staff only)
 */
router.delete('/:id', authenticate, cancelAppointment);

export default router;