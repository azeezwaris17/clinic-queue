// backend/src/controllers/patients.controller.ts
/**
 * Patients Controller
 * 
 * Handles all patient-related business logic including CRUD operations,
 * search functionality, and patient visit history management.
 */

import { Request, Response } from 'express';
import { PatientService, PatientRegistrationData } from '../services/patient.service';
import { asyncHandler } from '../middleware';

/**
 * Get paginated list of patients
 * @route GET /api/patients
 * @access Private
 */
export const getPatients = asyncHandler(async (req: Request, res: Response) => {
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 20;

  // Use the service to get all patients with pagination
  const result = await PatientService.searchPatients({
    query: '',
    page,
    limit
  });

  res.status(200).json({
    success: true,
    data: result.patients,
    pagination: {
      page: result.page,
      limit,
      total: result.total,
      pages: result.pages
    }
  });
});

/**
 * Get patient by ID with full details
 * @route GET /api/patients/:id
 * @access Private
 */
export const getPatientById = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;

  try {
    const patient = await PatientService.getPatientById(id);

    res.status(200).json({
      success: true,
      data: patient
    });
  } catch (error: any) {
    res.status(404).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Search patients by name, email, or phone
 * @route GET /api/patients/search
 * @access Private
 */
export const searchPatients = asyncHandler(async (req: Request, res: Response) => {
  const { query, page = '1', limit = '10' } = req.query;
  
  if (!query || (query as string).trim().length < 2) {
    res.status(400).json({
      success: false,
      error: 'Search query must be at least 2 characters long'
    });
    return;
  }

  const pageNum = parseInt(page as string);
  const limitNum = parseInt(limit as string);

  const result = await PatientService.searchPatients({
    query: query as string,
    page: pageNum,
    limit: limitNum
  });

  res.status(200).json({
    success: true,
    data: result.patients,
    pagination: {
      page: result.page,
      limit: result.pages,
      total: result.total,
      pages: result.pages
    }
  });
});

/**
 * Create new patient record
 * @route POST /api/patients
 * @access Private
 */
export const createPatient = asyncHandler(async (req: Request, res: Response) => {
  try {
    const patientData: PatientRegistrationData = req.body;
    const patient = await PatientService.registerPatient(patientData);

    res.status(201).json({
      success: true,
      message: 'Patient created successfully',
      data: patient
    });
  } catch (error: any) {
    const statusCode = error.message.includes('already exists') ? 409 : 400;
    res.status(statusCode).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Update patient information
 * @route PATCH /api/patients/:id
 * @access Private
 */
export const updatePatient = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;

  try {
    const patient = await PatientService.updatePatient(id, req.body);

    res.status(200).json({
      success: true,
      message: 'Patient updated successfully',
      data: patient
    });
  } catch (error: any) {
    const statusCode = error.message.includes('not found') ? 404 : 400;
    res.status(statusCode).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Get patient's visit history
 * @route GET /api/patients/:id/visits
 * @access Private
 */
export const getPatientVisits = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const { limit = '10' } = req.query;

  const limitNum = parseInt(limit as string);
  
  if (limitNum < 1 || limitNum > 100) {
    res.status(400).json({
      success: false,
      error: 'Limit must be between 1 and 100'
    });
    return;
  }

  try {
    const visits = await PatientService.getPatientVisits(id, limitNum);

    res.status(200).json({
      success: true,
      data: visits,
      count: visits.length
    });
  } catch (error: any) {
    res.status(404).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Get patient statistics
 * @route GET /api/patients/stats
 * @access Private (Admin only)
 */
export const getPatientStatistics = asyncHandler(async ( res: Response) => {
  try {
    const statistics = await PatientService.getPatientStatistics();

    res.status(200).json({
      success: true,
      data: statistics
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve patient statistics'
    });
  }
});

/**
 * Merge duplicate patient records
 * @route POST /api/patients/merge
 * @access Private (Admin only)
 */
export const mergePatients = asyncHandler(async (req: Request, res: Response) => {
  const { primaryPatientId, duplicatePatientId } = req.body;

  if (!primaryPatientId || !duplicatePatientId) {
    res.status(400).json({
      success: false,
      error: 'Both primary and duplicate patient IDs are required'
    });
    return;
  }

  try {
    const result = await PatientService.mergePatients(primaryPatientId, duplicatePatientId);

    res.status(200).json({
      success: true,
      data: result
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
});