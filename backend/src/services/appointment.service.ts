// backend/src/services/appointment.service.ts
/**
 * Appointment Management Service
 * 
 * Handles business logic for appointment scheduling, conflict detection,
 * appointment lifecycle management, and provider availability.
 * Separates appointment-related business logic from route handlers.
 */

import Appointment, { IAppointment } from '../models/Appointment';
import Patient from '../models/Patient';
import Staff from '../models/Staff';
import Visit from '../models/Visit';

/**
 * Appointment creation data interface
 */
export interface CreateAppointmentData {
  patientId: string;
  doctorId: string;
  scheduledTime: string; // ISO date string
  duration: number; // minutes
  reasonForVisit: string;
  appointmentType: 'checkup' | 'consultation' | 'followup' | 'emergency';
  chiefComplaint?: string;
  notes?: string;
  preAppointmentInstructions?: string;
  createdBy: string;
}

/**
 * Appointment response interface
 */
export interface AppointmentResponse {
  success: boolean;
  appointment: IAppointment;
  message: string;
}

/**
 * Availability check interface
 */
export interface AvailabilityCheck {
  available: boolean;
  conflicts: any[];
  suggestedTimes?: Date[]; 
}

/**
 * Appointment Service Class
 * 
 * Encapsulates all appointment-related business logic
 */
export class AppointmentService {
  /**
   * Creates a new appointment with conflict detection
   * 
   * @param data - Appointment creation data
   * @returns Appointment response with created appointment
   * @throws {Error} If validation fails or conflicts detected
   */
  static async createAppointment(data: CreateAppointmentData): Promise<AppointmentResponse> {
    const {
      patientId,
      doctorId,
      scheduledTime,
      duration,
      reasonForVisit,
      appointmentType,
      chiefComplaint,
      notes,
      preAppointmentInstructions,
      createdBy
    } = data;

    // Verify patient exists
    const patient = await Patient.findById(patientId);
    if (!patient) {
      throw new Error('Patient not found');
    }

    // Verify doctor exists and is active
    const doctor = await Staff.findOne({ 
      _id: doctorId, 
      role: 'doctor',
      isActive: true 
    });
    if (!doctor) {
      throw new Error('Doctor not found or inactive');
    }

    const scheduledDateTime = new Date(scheduledTime);

    // Check for scheduling conflicts
    const conflicts = await (Appointment as any).findConflictingAppointments(
      doctorId,
      scheduledDateTime,
      duration
    );

    if (conflicts.length > 0) {
      throw new Error(`Scheduling conflict: Doctor is not available at the requested time. Conflicts: ${conflicts.length}`);
    }

    // Validate appointment time (business hours, future date, etc.)
    await this.validateAppointmentTime(scheduledDateTime, duration);

    // Create appointment
    const appointment = new Appointment({
      patient: patientId,
      doctor: doctorId,
      scheduledTime: scheduledDateTime,
      duration,
      reasonForVisit,
      appointmentType,
      chiefComplaint,
      notes,
      preAppointmentInstructions,
      createdBy
    });

    await appointment.save();
    await appointment.populate('patient doctor');

    return {
      success: true,
      appointment,
      message: 'Appointment scheduled successfully'
    };
  }

  /**
   * Updates an existing appointment
   * 
   * @param appointmentId - Appointment ID to update
   * @param updates - Fields to update
   * @returns Updated appointment
   * @throws {Error} If appointment not found or validation fails
   */
  static async updateAppointment(
    appointmentId: string, 
    updates: Partial<CreateAppointmentData>
  ): Promise<AppointmentResponse> {
    const appointment = await Appointment.findById(appointmentId);
    
    if (!appointment) {
      throw new Error('Appointment not found');
    }

    // Check if appointment can be modified
    if (!(appointment as any).canBeModified()) {
      throw new Error('Appointment cannot be modified (too close to scheduled time)');
    }

    // If changing time/doctor, check for conflicts
    if (updates.scheduledTime || updates.doctorId || updates.duration) {
      const doctorId = updates.doctorId || appointment.doctor.toString();
      const scheduledTime = updates.scheduledTime ? new Date(updates.scheduledTime) : appointment.scheduledTime;
      const duration = updates.duration || appointment.duration;

      const conflicts = await (Appointment as any).findConflictingAppointments(
        doctorId,
        scheduledTime,
        duration,
        appointmentId // Exclude current appointment
      );

      if (conflicts.length > 0) {
        throw new Error('Scheduling conflict: Doctor is not available at the requested time');
      }
    }

    const updatedAppointment = await Appointment.findByIdAndUpdate(
      appointmentId,
      updates,
      { new: true, runValidators: true }
    ).populate('patient doctor');

    if (!updatedAppointment) {
      throw new Error('Failed to update appointment');
    }

    return {
      success: true,
      appointment: updatedAppointment,
      message: 'Appointment updated successfully'
    };
  }

  /**
   * Cancels an appointment
   * 
   * @param appointmentId - Appointment ID to cancel
   * @param cancellationReason - Reason for cancellation
   * @returns Cancelled appointment
   * @throws {Error} If appointment not found or cannot be cancelled
   */
  static async cancelAppointment(
    appointmentId: string, 
    cancellationReason: string
  ): Promise<AppointmentResponse> {
    const appointment = await Appointment.findById(appointmentId);
    
    if (!appointment) {
      throw new Error('Appointment not found');
    }

    // Check if appointment can be cancelled
    if (!(appointment as any).canBeCancelled()) {
      throw new Error('Appointment cannot be cancelled (too close to scheduled time)');
    }

    appointment.status = 'cancelled';
    appointment.cancellationReason = cancellationReason;
    await appointment.save();

    return {
      success: true,
      appointment,
      message: 'Appointment cancelled successfully'
    };
  }

  /**
   * Checks doctor availability for a time slot
   * 
   * @param doctorId - Doctor ID to check
   * @param startTime - Proposed start time
   * @param duration - Appointment duration in minutes
   * @param excludeAppointmentId - Appointment ID to exclude (for updates)
   * @returns Availability check result
   */

// In the checkDoctorAvailability method, ensure suggestedTimes is always an array:
static async checkDoctorAvailability(
  doctorId: string,
  startTime: Date,
  duration: number,
  excludeAppointmentId?: string
): Promise<AvailabilityCheck> {
  const conflicts = await (Appointment as any).findConflictingAppointments(
    doctorId,
    startTime,
    duration,
    excludeAppointmentId
  );

  const isAvailable = conflicts.length === 0;

  // Always return an array, even if empty
  let suggestedTimes: Date[] = [];
  if (!isAvailable) {
    suggestedTimes = await this.findNextAvailableSlots(doctorId, startTime, duration);
  }

  return {
    available: isAvailable,
    conflicts,
    suggestedTimes // This will always be an array now
  };
}

  /**
   * Gets appointments with filtering and pagination
   * 
   * @param filters - Filter criteria
   * @param page - Page number
   * @param limit - Items per page
   * @returns Paginated appointments
   */
  static async getAppointments(
    filters: {
      startDate?: Date;
      endDate?: Date;
      status?: string;
      doctorId?: string;
      patientId?: string;
    } = {},
    page: number = 1,
    limit: number = 20
  ): Promise<{
    appointments: IAppointment[];
    total: number;
    page: number;
    pages: number;
  }> {
    const skip = (page - 1) * limit;
    
    // Build filter object
    const filter: any = {};
    
    if (filters.startDate && filters.endDate) {
      filter.scheduledTime = {
        $gte: filters.startDate,
        $lte: filters.endDate
      };
    }

    if (filters.status) {
      filter.status = filters.status;
    }

    if (filters.doctorId) {
      filter.doctor = filters.doctorId;
    }

    if (filters.patientId) {
      filter.patient = filters.patientId;
    }

    const appointments = await Appointment.find(filter)
      .populate('patient', 'firstName lastName phone email')
      .populate('doctor', 'firstName lastName specialty')
      .populate('createdBy', 'firstName lastName')
      .populate('visit')
      .sort({ scheduledTime: 1 })
      .skip(skip)
      .limit(limit);

    const total = await Appointment.countDocuments(filter);

    return {
      appointments,
      total,
      page,
      pages: Math.ceil(total / limit)
    };
  }

  /**
   * Converts appointment to visit (check-in)
   * 
   * @param appointmentId - Appointment ID to convert
   * @param vitals - Patient vital signs
   * @param symptoms - Patient symptoms
   * @returns Created visit
   * @throws {Error} If appointment not found or already checked in
   */
  static async convertToVisit(
    appointmentId: string,
    vitals: {
      temperature: number;
      heartRate: number;
      bloodPressureSystolic: number;
      bloodPressureDiastolic: number;
      painLevel: number;
    },
    symptoms: string
  ): Promise<any> {
    const appointment = await Appointment.findById(appointmentId)
      .populate('patient');
    
    if (!appointment) {
      throw new Error('Appointment not found');
    }

    if (appointment.status === 'checked-in') {
      throw new Error('Appointment already checked in');
    }

    // Create visit from appointment
    const visit = new Visit({
      appointment: appointmentId,
      patient: appointment.patient._id,
      symptoms,
      vitals,
      checkInTime: new Date()
    });

    await visit.save();

    // Update appointment status
    appointment.status = 'checked-in';
    appointment.visit = visit._id;
    await appointment.save();

    return visit;
  }

  /**
   * Validates appointment time against business rules
   * 
   * @param scheduledTime - Proposed appointment time
   * @param duration - Appointment duration
   * @throws {Error} If time validation fails
   */
  private static async validateAppointmentTime(scheduledTime: Date, duration: number): Promise<void> {
    const now = new Date();
    
    // Check if appointment is in the future
    if (scheduledTime <= now) {
      throw new Error('Appointment must be scheduled for a future time');
    }

    // Check business hours (9 AM - 5 PM)
    const hour = scheduledTime.getHours();
    if (hour < 9 || hour >= 17) {
      throw new Error('Appointments can only be scheduled between 9 AM and 5 PM');
    }

    // Check minimum advance notice (1 hour)
    const minAdvanceNotice = 60 * 60 * 1000; // 1 hour in milliseconds
    if (scheduledTime.getTime() - now.getTime() < minAdvanceNotice) {
      throw new Error('Appointments must be scheduled at least 1 hour in advance');
    }

    // Validate duration
    if (duration < 15 || duration > 120) {
      throw new Error('Appointment duration must be between 15 and 120 minutes');
    }
  }

  /**
   * Finds next available time slots for a doctor
   * 
   * @param doctorId - Doctor ID
   * @param preferredTime - Preferred time
   * @param duration - Appointment duration
   * @returns Array of available time slots
   */
  private static async findNextAvailableSlots(
    doctorId: string,
    preferredTime: Date,
    duration: number
  ): Promise<Date[]> {
    const suggestedTimes: Date[] = [];
    const baseTime = new Date(preferredTime);

    // Check slots in 30-minute increments for the next 3 days
    for (let dayOffset = 0; dayOffset < 3; dayOffset++) {
      for (let hour = 9; hour < 17; hour++) {
        for (let minute = 0; minute < 60; minute += 30) {
          const slotTime = new Date(baseTime);
          slotTime.setDate(slotTime.getDate() + dayOffset);
          slotTime.setHours(hour, minute, 0, 0);

          // Skip if slot is in the past
          if (slotTime <= new Date()) continue;

          const availability = await this.checkDoctorAvailability(doctorId, slotTime, duration);
          
          if (availability.available) {
            suggestedTimes.push(slotTime);
            
            // Return up to 3 suggestions
            if (suggestedTimes.length >= 3) {
              return suggestedTimes;
            }
          }
        }
      }
    }

    return suggestedTimes;
  }
}