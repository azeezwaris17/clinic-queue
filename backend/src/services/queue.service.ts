// backend/src/services/queue.service.ts
/**
 * Queue Management Service
 * 
 * Handles business logic for real-time queue operations, patient flow,
 * status transitions, and queue analytics.
 * Separates queue-related business logic from route handlers.
 */

import Queue, { IQueue } from '../models/Queue';
import Visit from '../models/Visit';
import Staff from '../models/Staff';

/**
 * Queue status update data interface
 */
export interface QueueStatusUpdate {
  status: 'waiting' | 'in-progress' | 'completed' | 'cancelled';
  doctorId?: string;
  assignedRoom?: string;
  notes?: string;
}

/**
 * Next patient call data interface
 */
export interface NextPatientCall {
  doctorId: string;
  assignedRoom?: string;
}

/**
 * Queue statistics interface
 */
export interface QueueStatistics {
  total: number;
  byStatus: Array<{
    status: string;
    count: number;
    avgWaitTime: number;
  }>;
  visitsToday: number;
  triageStats: Array<{
    _id: string;
    count: number;
  }>;
  averageWaitTime: number;
  longestWaitTime: number;
}

/**
 * Queue Service Class
 * 
 * Encapsulates all queue-related business logic
 */
export class QueueService {
  /**
   * Gets the current active queue
   * 
   * @returns Current queue with patient details
   */
  static async getCurrentQueue(): Promise<IQueue[]> {
    return await Queue.getCurrentQueue();
  }

  /**
   * Updates queue entry status
   * 
   * @param queueId - Queue entry ID
   * @param updateData - Status update data
   * @returns Updated queue entry
   * @throws {Error} If queue entry not found or invalid status transition
   */
  static async updateQueueStatus(
    queueId: string,
    updateData: QueueStatusUpdate
  ): Promise<IQueue> {
    const queueEntry = await Queue.findById(queueId);
    
    if (!queueEntry) {
      throw new Error('Queue entry not found');
    }

    // Validate status transition
    if (!this.isValidStatusTransition(queueEntry.status, updateData.status)) {
      throw new Error(`Invalid status transition from ${queueEntry.status} to ${updateData.status}`);
    }

    // Set timing information based on status changes
    const updateWithTiming = { ...updateData };
    
    if (updateData.status === 'in-progress' && queueEntry.status !== 'in-progress') {
      (updateWithTiming as any).calledTime = new Date();
      (updateWithTiming as any).consultationStartTime = new Date();
    }

    if (updateData.status === 'completed' && queueEntry.status !== 'completed') {
      (updateWithTiming as any).consultationEndTime = new Date();
    }

    const updatedQueue = await Queue.findByIdAndUpdate(
      queueId,
      updateWithTiming,
      { new: true, runValidators: true }
    )
    .populate('patient', 'firstName lastName dateOfBirth gender')
    .populate('visit')
    .populate('doctor', 'firstName lastName specialty');

    if (!updatedQueue) {
      throw new Error('Failed to update queue entry');
    }

    // Recalculate positions if status changed to waiting
    if (updateData.status === 'waiting') {
      await Queue.recalculatePositions();
    }

    return updatedQueue;
  }

  /**
   * Calls the next patient for consultation
   * 
   * @param callData - Next patient call data
   * @returns Called patient queue entry
   * @throws {Error} If no patients waiting
   */
  static async callNextPatient(callData: NextPatientCall): Promise<IQueue> {
    const { doctorId, assignedRoom } = callData;

    // Verify doctor exists and is active
    const doctor = await Staff.findOne({
      _id: doctorId,
      role: 'doctor',
      isActive: true
    });

    if (!doctor) {
      throw new Error('Doctor not found or inactive');
    }

    // Find the next patient based on priority and position
    const nextPatient = await Queue.findOne({
      status: 'waiting'
    })
    .sort({ 
      priority: -1, 
      position: 1, 
      checkInTime: 1 
    })
    .populate('patient', 'firstName lastName dateOfBirth gender')
    .populate('visit', 'symptoms triageLevel triageScore vitals');

    if (!nextPatient) {
      throw new Error('No patients waiting in queue');
    }

    // Update the queue entry
    nextPatient.status = 'in-progress';
    nextPatient.doctor = doctorId as any;
    nextPatient.calledTime = new Date();
    nextPatient.consultationStartTime = new Date();
    
    if (assignedRoom) {
      nextPatient.assignedRoom = assignedRoom;
    }

    await nextPatient.save();

    // Recalculate positions for remaining waiting patients
    await Queue.recalculatePositions();

    return nextPatient;
  }

  /**
   * Recalculates queue positions based on priority and check-in time
   * 
   * @returns Recalculation result
   */
  static async recalculatePositions(): Promise<{
    success: boolean;
    message: string;
    updatedCount: number;
  }> {
    await Queue.recalculatePositions();

    const waitingCount = await Queue.countDocuments({ status: 'waiting' });

    return {
      success: true,
      message: `Queue positions recalculated for ${waitingCount} waiting patients`,
      updatedCount: waitingCount
    };
  }

  /**
   * Gets comprehensive queue statistics
   * 
   * @returns Queue statistics
   */
  static async getQueueStatistics(): Promise<QueueStatistics> {
    // Get basic queue stats
    const queueStats = await Queue.getQueueStats();
    const baseStats = queueStats[0] || { total: 0, byStatus: [] };

    // Get today's visits count
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const visitsToday = await Visit.countDocuments({
      checkInTime: { $gte: today }
    });

    // Get triage distribution for today
    const triageStats = await Visit.aggregate([
      {
        $match: {
          checkInTime: { $gte: today }
        }
      },
      {
        $group: {
          _id: '$triageLevel',
          count: { $sum: 1 }
        }
      }
    ]);

    // Calculate average and longest wait times
    const waitTimeStats = await Queue.aggregate([
      {
        $match: {
          status: 'completed',
          actualWaitTime: { $exists: true, $gt: 0 }
        }
      },
      {
        $group: {
          _id: null,
          averageWaitTime: { $avg: '$actualWaitTime' },
          longestWaitTime: { $max: '$actualWaitTime' }
        }
      }
    ]);

    const waitTimeResult = waitTimeStats[0] || { averageWaitTime: 0, longestWaitTime: 0 };

    return {
      ...baseStats,
      visitsToday,
      triageStats,
      averageWaitTime: waitTimeResult.averageWaitTime,
      longestWaitTime: waitTimeResult.longestWaitTime
    };
  }

  /**
   * Gets doctor-specific queue
   * 
   * @param doctorId - Doctor ID
   * @returns Doctor's current queue
   */
  static async getDoctorQueue(doctorId: string): Promise<IQueue[]> {
    const doctorQueue = await Queue.find({
      doctor: doctorId,
      status: { $in: ['waiting', 'in-progress'] }
    })
    .populate('patient', 'firstName lastName dateOfBirth gender')
    .populate('visit', 'symptoms triageLevel triageScore vitals')
    .sort({ 
      status: -1, // in-progress first
      priority: -1,
      position: 1 
    });

    return doctorQueue;
  }

  /**
   * Adds a patient to the queue
   * 
   * @param visitId - Visit ID
   * @param patientId - Patient ID
   * @param priority - Priority level
   * @param estimatedWaitTime - Estimated wait time
   * @returns Created queue entry
   * @throws {Error} If visit already in queue
   */
  static async addToQueue(
    visitId: string,
    patientId: string,
    priority: 'high' | 'medium' | 'low',
    estimatedWaitTime: number
  ): Promise<IQueue> {
    // Check if visit is already in queue
    const existingEntry = await Queue.findOne({ visit: visitId });
    if (existingEntry) {
      throw new Error('Visit already exists in queue');
    }

    const nextPosition = await Queue.getNextPosition();

    const queueEntry = new Queue({
      visit: visitId,
      patient: patientId,
      position: nextPosition,
      status: 'waiting',
      priority,
      estimatedWaitTime,
      checkInTime: new Date()
    });

    await queueEntry.save();

    return queueEntry;
  }

  /**
   * Removes a patient from the queue
   * 
   * @param queueId - Queue entry ID
   * @param reason - Reason for removal
   * @returns Removal result
   * @throws {Error} If queue entry not found
   */
  static async removeFromQueue(
    queueId: string,
    reason: string = 'Manual removal'
  ): Promise<{
    success: boolean;
    message: string;
    removedEntry: IQueue;
  }> {
    const queueEntry = await Queue.findByIdAndUpdate(
      queueId,
      { 
        status: 'cancelled',
        notes: reason
      },
      { new: true }
    );

    if (!queueEntry) {
      throw new Error('Queue entry not found');
    }

    // Recalculate positions
    await Queue.recalculatePositions();

    return {
      success: true,
      message: 'Patient removed from queue',
      removedEntry: queueEntry
    };
  }

  /**
   * Validates status transitions
   * 
   * @param fromStatus - Current status
   * @param toStatus - Target status
   * @returns Whether transition is valid
   */
  private static isValidStatusTransition(
    fromStatus: string,
    toStatus: string
  ): boolean {
    const validTransitions: { [key: string]: string[] } = {
      'waiting': ['in-progress', 'cancelled'],
      'in-progress': ['completed', 'cancelled', 'waiting'],
      'completed': [], // No transitions from completed
      'cancelled': ['waiting'] // Allow re-adding cancelled patients
    };

    return validTransitions[fromStatus]?.includes(toStatus) || false;
  }
}