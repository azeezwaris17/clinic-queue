// backend/src/controllers/queue.controller.ts
/**
 * Queue Controller
 * 
 * Handles real-time queue management operations including status updates,
 * patient calling, and queue analytics for clinic dashboard.
 */

import { Request, Response } from 'express';
import { QueueService, QueueStatusUpdate, NextPatientCall } from '../services/queue.service';
import { asyncHandler } from '../middleware';

/**
 * Get current queue with patient details
 * @route GET /api/queue
 * @access Private
 */
export const getQueue = asyncHandler(async ( res: Response) => {
  try {
    const queue = await QueueService.getCurrentQueue();

    res.status(200).json({
      success: true,
      data: queue,
      count: queue.length
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve queue'
    });
  }
});

/**
 * Get optimized current queue for display
 * @route GET /api/queue/current
 * @access Private
 */
export const getCurrentQueue = asyncHandler(async ( res: Response) => {
  try {
    const queue = await QueueService.getCurrentQueue();

    res.status(200).json({
      success: true,
      data: queue,
      count: queue.length
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve current queue'
    });
  }
});

/**
 * Get queue statistics for dashboard
 * @route GET /api/queue/stats
 * @access Private
 */
export const getQueueStats = asyncHandler(async ( res: Response) => {
  try {
    const statistics = await QueueService.getQueueStatistics();

    res.status(200).json({
      success: true,
      data: statistics
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve queue statistics'
    });
  }
});

/**
 * Update queue entry status
 * @route PATCH /api/queue/:id
 * @access Private
 */
export const updateQueueStatus = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const { status, doctorId, assignedRoom, notes } = req.body;

  if (!status) {
    res.status(400).json({
      success: false,
      error: 'Status is required'
    });
    return;
  }

  const updateData: QueueStatusUpdate = {
    status,
    doctorId,
    assignedRoom,
    notes
  };

  try {
    const updatedQueue = await QueueService.updateQueueStatus(id, updateData);

    res.status(200).json({
      success: true,
      message: 'Queue status updated successfully',
      data: updatedQueue
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
 * Call next patient for consultation
 * @route POST /api/queue/call-next
 * @access Private (Doctor only)
 */
export const callNextPatient = asyncHandler(async (req: Request, res: Response) => {
  const { doctorId, assignedRoom } = req.body;

  if (!doctorId) {
    res.status(400).json({
      success: false,
      error: 'Doctor ID is required'
    });
    return;
  }

  const callData: NextPatientCall = {
    doctorId,
    assignedRoom
  };

  try {
    const nextPatient = await QueueService.callNextPatient(callData);

    res.status(200).json({
      success: true,
      message: 'Patient called for consultation',
      data: nextPatient
    });
  } catch (error: any) {
    const statusCode = error.message.includes('No patients') ? 404 : 400;
    res.status(statusCode).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Recalculate queue positions
 * @route POST /api/queue/recalculate
 * @access Private (Admin only)
 */
export const recalculatePositions = asyncHandler(async ( res: Response) => {
  try {
    const result = await QueueService.recalculatePositions();

    const updatedQueue = await QueueService.getCurrentQueue();

    res.status(200).json({
      success: true,
      message: result.message,
      data: updatedQueue
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: 'Failed to recalculate queue positions'
    });
  }
});

/**
 * Get doctor-specific queue
 * @route GET /api/queue/doctor/:doctorId
 * @access Private
 */
export const getDoctorQueue = asyncHandler(async (req: Request, res: Response) => {
  const { doctorId } = req.params;

  try {
    const doctorQueue = await QueueService.getDoctorQueue(doctorId);

    res.status(200).json({
      success: true,
      data: doctorQueue,
      count: doctorQueue.length
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve doctor queue'
    });
  }
});

/**
 * Add patient to queue
 * @route POST /api/queue
 * @access Private
 */
export const addToQueue = asyncHandler(async (req: Request, res: Response) => {
  const { visitId, patientId, priority, estimatedWaitTime } = req.body;

  if (!visitId || !patientId || !priority || !estimatedWaitTime) {
    res.status(400).json({
      success: false,
      error: 'Visit ID, patient ID, priority, and estimated wait time are required'
    });
    return;
  }

  try {
    const queueEntry = await QueueService.addToQueue(
      visitId,
      patientId,
      priority,
      estimatedWaitTime
    );

    res.status(201).json({
      success: true,
      message: 'Patient added to queue successfully',
      data: queueEntry
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Remove patient from queue
 * @route DELETE /api/queue/:id
 * @access Private
 */
export const removeFromQueue = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const { reason } = req.body;

  try {
    const result = await QueueService.removeFromQueue(id, reason);

    res.status(200).json({
      success: true,
      data: result
    });
  } catch (error: any) {
    res.status(404).json({
      success: false,
      error: error.message
    });
  }
});