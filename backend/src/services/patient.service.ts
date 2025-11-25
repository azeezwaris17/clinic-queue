// backend/src/services/patient.service.ts
/**
 * Patient Management Service
 * 
 * Handles business logic for patient registration, profile management,
 * medical history, and patient search operations.
 * Separates patient-related business logic from route handlers.
 */

import Patient, { IPatient } from '../models/Patient';
import Visit from '../models/Visit';
import Appointment from '../models/Appointment';

/**
 * Patient registration data interface
 */
export interface PatientRegistrationData {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  dateOfBirth: string; // ISO date string
  gender: 'male' | 'female' | 'other';
  address: string;
  city: string;
  state: string;
  zipCode: string;
  emergencyContact: {
    name: string;
    relationship: string;
    phone: string;
  };
  allergies?: string[];
  currentMedications?: string[];
  medicalHistory?: string[];
  insuranceProvider?: string;
  insuranceId?: string;
}

/**
 * Patient search criteria interface
 */
export interface PatientSearchCriteria {
  query: string;
  page?: number;
  limit?: number;
}

/**
 * Patient statistics interface
 */
export interface PatientStatistics {
  totalPatients: number;
  newPatientsThisMonth: number;
  byGender: { [key: string]: number };
  byAgeGroup: { [key: string]: number };
}

/**
 * Patient Service Class
 * 
 * Encapsulates all patient-related business logic
 */
export class PatientService {
  /**
   * Registers a new patient
   * 
   * @param data - Patient registration data
   * @returns Created patient record
   * @throws {Error} If validation fails or patient already exists
   */
  static async registerPatient(data: PatientRegistrationData): Promise<IPatient> {
    const {
      email,
      phone,
      dateOfBirth
    } = data;

    // Check if patient already exists with same email or phone
    const existingPatient = await Patient.findOne({
      $or: [
        { email },
        { phone }
      ]
    });

    if (existingPatient) {
      throw new Error('Patient with this email or phone number already exists');
    }

    // Validate date of birth
    const dob = new Date(dateOfBirth);
    if (dob >= new Date()) {
      throw new Error('Date of birth must be in the past');
    }

    // Calculate age for validation
    const age = this.calculateAge(dob);
    if (age > 120) {
      throw new Error('Invalid date of birth');
    }

    const patient = new Patient({
      ...data,
      dateOfBirth: dob
    });

    await patient.save();

    return patient;
  }

  /**
   * Updates patient information
   * 
   * @param patientId - Patient ID to update
   * @param updates - Fields to update
   * @returns Updated patient record
   * @throws {Error} If patient not found or validation fails
   */
  static async updatePatient(
    patientId: string,
    updates: Partial<PatientRegistrationData>
  ): Promise<IPatient> {
    // Check if email or phone conflicts with other patients
    if (updates.email || updates.phone) {
      const conflictFilter: any = { _id: { $ne: patientId } };
      
      if (updates.email) {
        conflictFilter.email = updates.email;
      }
      if (updates.phone) {
        conflictFilter.phone = updates.phone;
      }

      const conflictingPatient = await Patient.findOne(conflictFilter);
      if (conflictingPatient) {
        throw new Error('Another patient already exists with this email or phone number');
      }
    }

    const patient = await Patient.findByIdAndUpdate(
      patientId,
      updates,
      { new: true, runValidators: true }
    );

    if (!patient) {
      throw new Error('Patient not found');
    }

    return patient;
  }

  /**
   * Searches patients by various criteria
   * 
   * @param criteria - Search criteria
   * @returns Paginated search results
   */
  static async searchPatients(criteria: PatientSearchCriteria): Promise<{
    patients: IPatient[];
    total: number;
    page: number;
    pages: number;
  }> {
    const {
      query,
      page = 1,
      limit = 10
    } = criteria;

    const skip = (page - 1) * limit;

    const searchFilter = {
      $or: [
        { firstName: { $regex: query, $options: 'i' } },
        { lastName: { $regex: query, $options: 'i' } },
        { email: { $regex: query, $options: 'i' } },
        { phone: { $regex: query, $options: 'i' } }
      ]
    };

    const patients = await Patient.find(searchFilter)
      .sort({ lastName: 1, firstName: 1 })
      .skip(skip)
      .limit(limit)
      .select('firstName lastName email phone dateOfBirth gender');

    const total = await Patient.countDocuments(searchFilter);

    return {
      patients,
      total,
      page,
      pages: Math.ceil(total / limit)
    };
  }

  /**
   * Gets patient by ID with full details
   * 
   * @param patientId - Patient ID
   * @returns Patient record with populated data
   * @throws {Error} If patient not found
   */
  static async getPatientById(patientId: string): Promise<any> {
    const patient = await Patient.findById(patientId)
      .populate('emergencyContact');

    if (!patient) {
      throw new Error('Patient not found');
    }

    // Get recent visits count
    const recentVisits = await Visit.countDocuments({
      patient: patientId,
      checkInTime: { 
        $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) // Last 30 days
      }
    });

    // Get upcoming appointments
    const upcomingAppointments = await Appointment.find({
      patient: patientId,
      status: 'scheduled',
      scheduledTime: { $gte: new Date() }
    })
    .populate('doctor', 'firstName lastName specialty')
    .sort({ scheduledTime: 1 })
    .limit(5);

    return {
      ...patient.toObject(),
      recentVisits,
      upcomingAppointments
    };
  }

  /**
   * Gets patient visit history
   * 
   * @param patientId - Patient ID
   * @param limit - Maximum number of visits to return
   * @returns Patient's visit history
   */
  static async getPatientVisits(patientId: string, limit: number = 10): Promise<any[]> {
    const visits = await Visit.find({ patient: patientId })
      .populate('appointment')
      .sort({ checkInTime: -1 })
      .limit(limit);

    return visits.map(visit => ({
      id: visit._id,
      checkInTime: visit.checkInTime,
      symptoms: visit.symptoms,
      triageLevel: visit.triageLevel,
      completedAt: visit.completedAt,
      hasAppointment: !!visit.appointment
    }));
  }

  /**
   * Gets patient statistics for dashboard
   * 
   * @returns Patient statistics
   */
  static async getPatientStatistics(): Promise<PatientStatistics> {
    const totalPatients = await Patient.countDocuments();

    // New patients this month
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const newPatientsThisMonth = await Patient.countDocuments({
      createdAt: { $gte: startOfMonth }
    });

    // Distribution by gender
    const genderDistribution = await Patient.aggregate([
      {
        $group: {
          _id: '$gender',
          count: { $sum: 1 }
        }
      }
    ]);

    // Distribution by age group
    const ageDistribution = await Patient.aggregate([
      {
        $project: {
          ageGroup: {
            $switch: {
              branches: [
                { case: { $lt: [{ $divide: [{ $subtract: [new Date(), '$dateOfBirth'] }, 365 * 24 * 60 * 60 * 1000] }, 18] }, then: '0-17' },
                { case: { $lt: [{ $divide: [{ $subtract: [new Date(), '$dateOfBirth'] }, 365 * 24 * 60 * 60 * 1000] }, 35] }, then: '18-34' },
                { case: { $lt: [{ $divide: [{ $subtract: [new Date(), '$dateOfBirth'] }, 365 * 24 * 60 * 60 * 1000] }, 50] }, then: '35-49' },
                { case: { $lt: [{ $divide: [{ $subtract: [new Date(), '$dateOfBirth'] }, 365 * 24 * 60 * 60 * 1000] }, 65] }, then: '50-64' }
              ],
              default: '65+'
            }
          }
        }
      },
      {
        $group: {
          _id: '$ageGroup',
          count: { $sum: 1 }
        }
      }
    ]);

    // Format distributions as objects
    const byGender = genderDistribution.reduce((acc, item) => {
      acc[item._id] = item.count;
      return acc;
    }, {} as { [key: string]: number });

    const byAgeGroup = ageDistribution.reduce((acc, item) => {
      acc[item._id] = item.count;
      return acc;
    }, {} as { [key: string]: number });

    return {
      totalPatients,
      newPatientsThisMonth,
      byGender,
      byAgeGroup
    };
  }

  /**
   * Merges duplicate patient records
   * 
   * @param primaryPatientId - Primary patient ID (will be kept)
   * @param duplicatePatientId - Duplicate patient ID (will be merged and deleted)
   * @returns Merge result
   * @throws {Error} If patients not found or merge not possible
   */
  static async mergePatients(primaryPatientId: string, duplicatePatientId: string): Promise<{
    success: boolean;
    message: string;
    mergedFrom: string;
    mergedTo: string;
  }> {
    if (primaryPatientId === duplicatePatientId) {
      throw new Error('Cannot merge patient with themselves');
    }

    const primaryPatient = await Patient.findById(primaryPatientId);
    const duplicatePatient = await Patient.findById(duplicatePatientId);

    if (!primaryPatient || !duplicatePatient) {
      throw new Error('One or both patients not found');
    }

    // Update all visits and appointments to point to primary patient
    await Visit.updateMany(
      { patient: duplicatePatientId },
      { patient: primaryPatientId }
    );

    await Appointment.updateMany(
      { patient: duplicatePatientId },
      { patient: primaryPatientId }
    );

    // Delete duplicate patient
    await Patient.findByIdAndDelete(duplicatePatientId);

    return {
      success: true,
      message: 'Patients merged successfully',
      mergedFrom: duplicatePatientId,
      mergedTo: primaryPatientId
    };
  }

  /**
   * Calculates age from date of birth
   * 
   * @param dateOfBirth - Date of birth
   * @returns Age in years
   */
  private static calculateAge(dateOfBirth: Date): number {
    const today = new Date();
    let age = today.getFullYear() - dateOfBirth.getFullYear();
    const monthDiff = today.getMonth() - dateOfBirth.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dateOfBirth.getDate())) {
      age--;
    }
    
    return age;
  }
}