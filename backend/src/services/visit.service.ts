// backend/src/services/visit.service.ts
/**
 * Visit Management Service
 * 
 * Handles business logic for patient visits including check-in processing,
 * triage scoring, queue management, and visit lifecycle operations.
 * Separates visit-related business logic from route handlers.
 */

import Visit from '../models/Visit';
import Patient from '../models/Patient';
import Queue from '../models/Queue';
import { calculateTriageScore, calculateEstimatedWaitTime, validateVitals } from '../utils/triage';
import { generateTrackingToken } from '../utils/jwt';

/**
 * Patient check-in data interface
 */
export interface CheckInData {
  // Patient demographic information
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  dateOfBirth: string; // ISO date string
  gender: 'male' | 'female' | 'other';
  
  // Clinical information
  symptoms: string;
  temperature: number;
  heartRate: number;
  bloodPressureSystolic: number;
  bloodPressureDiastolic: number;
  painLevel: number;
  
  // Optional medical history
  allergies?: string;
  medications?: string;
}

/**
 * Check-in response interface
 */
export interface CheckInResponse {
  success: boolean;
  trackingToken: string;
  visit: {
    id: string;
    triageLevel: string;
    triageScore: number;
    estimatedWaitTime: number;
    position: number;
  };
  patient: {
    id: string;
    firstName: string;
    lastName: string;
  };
}

/**
 * Visit Service Class
 * 
 * Encapsulates all visit-related business logic
 */
export class VisitService {
  /**
   * Processes patient check-in and creates visit record
   * 
   * @param data - Patient check-in data
   * @returns Check-in response with tracking token and visit details
   * @throws {Error} If validation fails or database operation fails
   */
  static async processCheckIn(data: CheckInData): Promise<CheckInResponse> {
    const {
      firstName,
      lastName,
      email,
      phone,
      dateOfBirth,
      gender,
      symptoms,
      temperature,
      heartRate,
      bloodPressureSystolic,
      bloodPressureDiastolic,
      painLevel,
      allergies,
      medications
    } = data;

    // Validate vital signs for clinical reasonableness
    const vitalsValidation = validateVitals({
      temperature,
      heartRate,
      bloodPressureSystolic,
      bloodPressureDiastolic,
      painLevel
    });

    if (!vitalsValidation.isValid) {
      throw new Error(`Vital sign validation failed: ${vitalsValidation.warnings.join(', ')}`);
    }

    // Start database transaction (simulated with session)
    const session = await Visit.startSession();
    session.startTransaction();

    try {
      // Find existing patient or create new one
      let patient = await Patient.findOne({ email }).session(session);
      
      if (!patient) {
        patient = new Patient({
          firstName,
          lastName,
          email,
          phone,
          dateOfBirth: new Date(dateOfBirth),
          gender,
          address: 'To be collected', // Placeholder for required fields
          city: 'To be collected',
          state: 'To be collected', 
          zipCode: 'To be collected',
          allergies: allergies ? [allergies] : [],
          currentMedications: medications ? [medications] : [],
          medicalHistory: [],
          emergencyContact: {
            name: 'To be collected',
            relationship: 'To be collected',
            phone: 'To be collected'
          }
        });
        
        await patient.save({ session });
      }

      // Calculate triage score and level
      const triageResult = calculateTriageScore({
        temperature,
        heartRate,
        bloodPressureSystolic,
        bloodPressureDiastolic,
        painLevel,
        symptoms
      });

      // Get number of patients ahead for wait time calculation
      const patientsAhead = await Queue.countDocuments({
        status: { $in: ['waiting', 'in-progress'] }
      }).session(session);

      // Calculate estimated wait time
      const avgConsultTime = parseInt(process.env.AVG_CONSULT_MINUTES || '15', 10);
      const estimatedWaitTime = calculateEstimatedWaitTime(patientsAhead, avgConsultTime);

      // Create visit record
      const visit = new Visit({
        patient: patient._id,
        symptoms,
        vitals: {
          temperature,
          heartRate,
          bloodPressureSystolic,
          bloodPressureDiastolic,
          painLevel
        },
        triageLevel: triageResult.level,
        triageScore: triageResult.score,
        estimatedWaitTime,
        checkInTime: new Date()
      });

      await visit.save({ session });

      // Add patient to queue
      const queuePosition = patientsAhead + 1;
      const queueEntry = new Queue({
        visit: visit._id,
        patient: patient._id,
        position: queuePosition,
        status: 'waiting',
        checkInTime: new Date()
      });

      await queueEntry.save({ session });

      // Generate tracking token for patient
      const trackingToken = generateTrackingToken(
        visit._id.toString(),
        patient._id.toString(),
        triageResult.level
      );

      // Commit transaction
      await session.commitTransaction();

      // Return check-in response
      return {
        success: true,
        trackingToken,
        visit: {
          id: visit._id.toString(),
          triageLevel: triageResult.level,
          triageScore: triageResult.score,
          estimatedWaitTime,
          position: queuePosition
        },
        patient: {
          id: patient._id.toString(),
          firstName: patient.firstName,
          lastName: patient.lastName
        }
      };

    } catch (error) {
      // Rollback transaction on error
      await session.abortTransaction();
      throw error;
    } finally {
      // End session
      session.endSession();
    }
  }

  /**
   * Gets visit details by ID with related data
   * 
   * @param visitId - Visit ID to retrieve
   * @returns Visit details with patient and queue information
   * @throws {Error} If visit not found
   */
  static async getVisitById(visitId: string): Promise<any> {
    const visit = await Visit.findById(visitId)
      .populate('patient', 'firstName lastName email phone dateOfBirth gender')
      .populate('appointment');

    if (!visit) {
      throw new Error('Visit not found');
    }

    // Get queue information
    const queueEntry = await Queue.findOne({ visit: visitId })
      .populate('doctor', 'firstName lastName specialty');

    return {
      ...visit.toObject(),
      queuePosition: queueEntry?.position,
      queueStatus: queueEntry?.status,
      doctor: queueEntry?.doctor
    };
  }

  /**
   * Gets visit history for a patient
   * 
   * @param patientId - Patient ID
   * @param limit - Maximum number of visits to return (default: 10)
   * @returns Array of patient's previous visits
   */
  static async getPatientVisits(patientId: string, limit: number = 10): Promise<any[]> {
    const visits = await Visit.find({ patient: patientId })
      .populate('patient', 'firstName lastName')
      .sort({ checkInTime: -1 })
      .limit(limit);

    return visits.map(visit => visit.toObject());
  }

  /**
   * Updates visit notes or completion status
   * 
   * @param visitId - Visit ID to update
   * @param updates - Fields to update (notes, completedAt)
   * @returns Updated visit document
   * @throws {Error} If visit not found
   */
  static async updateVisit(visitId: string, updates: {
    notes?: string;
    completedAt?: Date;
  }): Promise<any> {
    const visit = await Visit.findByIdAndUpdate(
      visitId,
      { $set: updates },
      { new: true, runValidators: true }
    ).populate('patient', 'firstName lastName');

    if (!visit) {
      throw new Error('Visit not found');
    }

    return visit;
  }

  /**
   * Gets statistics for visits and triage distribution
   * 
   * @returns Visit statistics for dashboard display
   */
  static async getVisitStatistics(): Promise<{
    totalVisits: number;
    visitsToday: number;
    byTriageLevel: { [key: string]: number };
    averageWaitTime: number;
  }> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Get total visits count
    const totalVisits = await Visit.countDocuments();

    // Get today's visits count
    const visitsToday = await Visit.countDocuments({
      checkInTime: { $gte: today, $lt: tomorrow }
    });

    // Get distribution by triage level
    const triageDistribution = await Visit.aggregate([
      {
        $group: {
          _id: '$triageLevel',
          count: { $sum: 1 }
        }
      }
    ]);

    // Calculate average wait time (simplified)
    const averageWaitTime = await Visit.aggregate([
      {
        $group: {
          _id: null,
          averageWaitTime: { $avg: '$estimatedWaitTime' }
        }
      }
    ]);

    // Format triage distribution as object
    const byTriageLevel = triageDistribution.reduce((acc, item) => {
      acc[item._id] = item.count;
      return acc;
    }, {} as { [key: string]: number });

    return {
      totalVisits,
      visitsToday,
      byTriageLevel,
      averageWaitTime: averageWaitTime[0]?.averageWaitTime || 0
    };
  }
}