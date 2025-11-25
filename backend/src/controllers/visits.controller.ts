// backend/src/controllers/visit.controller.ts
/**
 * Visit Controller
 * 
 * Handles HTTP requests for patient visits including check-in,
 * visit retrieval, and visit management. Separates HTTP concerns
 * from business logic implemented in VisitService.
 */

import { Request, Response } from 'express';
import { VisitService } from '../services/visit.service';
import { asyncHandler } from '../middleware';

/**
 * Handles patient check-in requests
 * 
 * @route POST /api/visits/check-in
 * @access Public
 * @param req - Express request with patient check-in data
 * @param res - Express response with tracking token and visit details
 * 
 * @example
 * // Request body:
 * {
 *   "firstName": "John",
 *   "lastName": "Doe",
 *   "email": "john.doe@example.com",
 *   "phone": "5551234567",
 *   "dateOfBirth": "1990-01-01",
 *   "gender": "male",
 *   "symptoms": "Fever and headache for 2 days",
 *   "temperature": 101.2,
 *   "heartRate": 88,
 *   "bloodPressureSystolic": 130,
 *   "bloodPressureDiastolic": 85,
 *   "painLevel": 5,
 *   "allergies": "Penicillin",
 *   "medications": "Ibuprofen as needed"
 * }
 * 
 * // Response:
 * {
 *   "success": true,
 *   "trackingToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
 *   "visit": {
 *     "id": "507f1f77bcf86cd799439012",
 *     "triageLevel": "medium",
 *     "triageScore": 45,
 *     "estimatedWaitTime": 60,
 *     "position": 3
 *   },
 *   "patient": {
 *     "id": "507f1f77bcf86cd799439013", 
 *     "firstName": "John",
 *     "lastName": "Doe"
 *   }
 * }
 */
export const checkIn = asyncHandler(async (req: Request, res: Response) => {
  // Process check-in through VisitService
  const result = await VisitService.processCheckIn(req.body);

  // Return successful check-in response
  res.status(201).json(result);
});

/**
 * Retrieves visit details by ID
 * 
 * @route GET /api/visits/:id
 * @access Public (consider restricting sensitive data)
 * @param req - Express request with visit ID in params
 * @param res - Express response with visit details
 */
export const getVisitById = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;

  // Validate visit ID parameter
  if (!id) {
    res.status(400).json({
      error: 'Missing visit ID',
      message: 'Visit ID is required in URL parameters'
    });
    return;
  }

  // Retrieve visit details through VisitService
  const visit = await VisitService.getVisitById(id);

  res.status(200).json({
    success: true,
    data: visit
  });
});

/**
 * Retrieves visit history for a patient
 * 
 * @route GET /api/visits/patient/:patientId
 * @access Private (requires authentication)
 * @param req - Express request with patient ID in params
 * @param res - Express response with patient's visit history
 */
export const getPatientVisits = asyncHandler(async (req: Request, res: Response) => {
  const { patientId } = req.params;
  const { limit = '10' } = req.query;

  // Validate patient ID parameter
  if (!patientId) {
    res.status(400).json({
      error: 'Missing patient ID',
      message: 'Patient ID is required in URL parameters'
    });
    return;
  }

  // Parse and validate limit parameter
  const limitNumber = parseInt(limit as string, 10);
  if (isNaN(limitNumber) || limitNumber < 1 || limitNumber > 100) {
    res.status(400).json({
      error: 'Invalid limit parameter',
      message: 'Limit must be a number between 1 and 100'
    });
    return;
  }

  // Retrieve patient visits through VisitService
  const visits = await VisitService.getPatientVisits(patientId, limitNumber);

  res.status(200).json({
    success: true,
    data: visits,
    count: visits.length
  });
});

/**
 * Updates visit information (notes, completion status)
 * 
 * @route PATCH /api/visits/:id
 * @access Private (requires authentication)
 * @param req - Express request with visit ID and update data
 * @param res - Express response with updated visit details
 */
export const updateVisit = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const { notes, completedAt } = req.body;

  // Validate visit ID parameter
  if (!id) {
    res.status(400).json({
      error: 'Missing visit ID',
      message: 'Visit ID is required in URL parameters'
    });
    return;
  }

  // Prepare update data
  const updates: any = {};
  if (notes !== undefined) updates.notes = notes;
  if (completedAt !== undefined) updates.completedAt = completedAt;

  // Validate that at least one field is being updated
  if (Object.keys(updates).length === 0) {
    res.status(400).json({
      error: 'No updates provided',
      message: 'At least one field (notes or completedAt) must be provided for update'
    });
    return;
  }

  // Update visit through VisitService
  const updatedVisit = await VisitService.updateVisit(id, updates);

  res.status(200).json({
    success: true,
    message: 'Visit updated successfully',
    data: updatedVisit
  });
});

/**
 * Retrieves visit statistics for dashboard
 * 
 * @route GET /api/visits/stats
 * @access Private (requires authentication)
 * @param req - Express request
 * @param res - Express response with visit statistics
 */
export const getVisitStatistics = asyncHandler(async ( res: Response) => {
  // Retrieve statistics through VisitService
  const statistics = await VisitService.getVisitStatistics();

  res.status(200).json({
    success: true,
    data: statistics
  });
});