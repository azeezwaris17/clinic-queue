// backend/src/routes/patients.ts
/**
 * Patient Management Routes
 * 
 * Handles CRUD operations for patient records and patient-related
 * data management. Includes endpoints for searching, updating, and
 * retrieving patient information.
 */

import express, { Router } from 'express';
import {
  getPatients,
  getPatientById,
  createPatient,
  updatePatient,
  searchPatients,
  getPatientVisits
} from '../controllers/patients.controller';
import { authenticate, } from '../middleware';
import { validate } from '../utils/validation';
import { z } from 'zod';

/**
 * Validation Schemas for Patient Routes
 */
const CreatePatientSchema = z.object({
  firstName: z.string().min(1, 'First name is required').max(50),
  lastName: z.string().min(1, 'Last name is required').max(50),
  email: z.string().email('Invalid email address'),
  phone: z.string().min(1, 'Phone number is required'),
  dateOfBirth: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format'),
  gender: z.enum(['male', 'female', 'other']),
  address: z.string().min(1, 'Address is required'),
  city: z.string().min(1, 'City is required'),
  state: z.string().min(1, 'State is required'),
  zipCode: z.string().min(1, 'ZIP code is required'),
  insuranceId: z.string().optional(),
  allergies: z.array(z.string()).optional(),
  currentMedications: z.array(z.string()).optional(),
  medicalHistory: z.array(z.string()).optional(),
  emergencyContact: z.object({
    name: z.string().min(1, 'Emergency contact name is required'),
    relationship: z.string().min(1, 'Relationship is required'),
    phone: z.string().min(1, 'Emergency contact phone is required')
  })
});

const UpdatePatientSchema = CreatePatientSchema.partial();

const SearchPatientsSchema = z.object({
  query: z.string().min(1, 'Search query is required').max(100),
  page: z.string().optional().default('1'),
  limit: z.string().optional().default('10')
});

const router: Router = express.Router();

/**
 * @route   GET /api/patients
 * @desc    Get paginated list of patients
 * @access  Private (Staff only)
 */
router.get('/', authenticate, getPatients);

/**
 * @route   GET /api/patients/search
 * @desc    Search patients by name, email, or phone
 * @access  Private (Staff only)
 */
router.get('/search', authenticate, validate(SearchPatientsSchema, 'query'), searchPatients);

/**
 * @route   GET /api/patients/:id
 * @desc    Get patient by ID with full details
 * @access  Private (Staff only)
 */
router.get('/:id', authenticate, getPatientById);

/**
 * @route   GET /api/patients/:id/visits
 * @desc    Get patient's visit history
 * @access  Private (Staff only)
 */
router.get('/:id/visits', authenticate, getPatientVisits);

/**
 * @route   POST /api/patients
 * @desc    Create new patient record
 * @access  Private (Staff only)
 */
router.post('/', authenticate, validate(CreatePatientSchema), createPatient);

/**
 * @route   PATCH /api/patients/:id
 * @desc    Update patient information
 * @access  Private (Staff only)
 */
router.patch('/:id', authenticate, validate(UpdatePatientSchema), updatePatient);

export default router;