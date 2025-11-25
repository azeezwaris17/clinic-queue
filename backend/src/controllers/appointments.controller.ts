// backend/src/controllers/appointments.controller.ts
/**
 * Appointments Controller
 * 
 * Handles appointment scheduling, management, and conflict detection
 * for healthcare provider scheduling system.
 */

import { Request, Response } from 'express';
import Appointment, { IAppointment } from '../models/Appointment';
import Patient from '../models/Patient';
import Staff from '../models/Staff';
import { asyncHandler } from '../middleware';

// Interface for appointment filter
interface AppointmentFilter {
  scheduledTime?: {
    $gte: Date;
    $lte: Date;
  };
  status?: string;
  doctor?: string;
}

/**
 * Get paginated list of appointments with filtering
 * @route GET /api/appointments
 * @access Private
 */
export const getAppointments = asyncHandler(async (req: Request, res: Response) => {
  const {
    startDate,
    endDate,
    status,
    doctorId,
    page = '1',
    limit = '20'
  } = req.query;

  const pageNum = parseInt(page as string);
  const limitNum = parseInt(limit as string);
  const skip = (pageNum - 1) * limitNum;

  // Build filter object
  const filter: AppointmentFilter = {};
  
  if (startDate && endDate) {
    filter.scheduledTime = {
      $gte: new Date(startDate as string),
      $lte: new Date(endDate as string)
    };
  }

  if (status) {
    filter.status = status as string;
  }

  if (doctorId) {
    filter.doctor = doctorId as string;
  }

  const appointments = await Appointment.find(filter)
    .populate('patient', 'firstName lastName phone email')
    .populate('doctor', 'firstName lastName specialty')
    .populate('createdBy', 'firstName lastName')
    .sort({ scheduledTime: 1 })
    .skip(skip)
    .limit(limitNum);

  const total = await Appointment.countDocuments(filter);

  res.status(200).json({
    success: true,
    data: appointments,
    pagination: {
      page: pageNum,
      limit: limitNum,
      total,
      pages: Math.ceil(total / limitNum)
    }
  });
});

/**
 * Get appointment by ID
 * @route GET /api/appointments/:id
 * @access Private
 */
export const getAppointmentById = asyncHandler(async (req: Request, res: Response) => {
  const appointment = await Appointment.findById(req.params.id)
    .populate('patient')
    .populate('doctor', 'firstName lastName specialty phone email')
    .populate('createdBy', 'firstName lastName')
    .populate('visit');

  if (!appointment) {
    res.status(404).json({
      success: false,
      error: 'Appointment not found'
    });
    return;
  }

  res.status(200).json({
    success: true,
    data: appointment
  });
});

/**
 * Create new appointment
 * @route POST /api/appointments
 * @access Private
 */
export const createAppointment = asyncHandler(async (req: Request, res: Response) => {
  const {
    patientId,
    doctorId,
    scheduledTime,
    duration,
    reasonForVisit,
    appointmentType,
    chiefComplaint,
    notes,
    preAppointmentInstructions
  } = req.body;

  // Verify patient exists
  const patient = await Patient.findById(patientId);
  if (!patient) {
    res.status(404).json({
      success: false,
      error: 'Patient not found'
    });
    return;
  }

  // Verify doctor exists and is actually a doctor
  const doctor = await Staff.findOne({ _id: doctorId, role: 'doctor' });
  if (!doctor) {
    res.status(404).json({
      success: false,
      error: 'Doctor not found or is not a doctor'
    });
    return;
  }

  // Check for scheduling conflicts
  const scheduledDateTime = new Date(scheduledTime);
  const conflictingAppointments = await (Appointment as any).findConflictingAppointments(
    doctorId,
    scheduledDateTime,
    duration
  );

  if (conflictingAppointments.length > 0) {
    res.status(409).json({
      success: false,
      error: 'Scheduling conflict: Doctor is not available at the requested time',
      conflicts: conflictingAppointments
    });
    return;
  }

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
    createdBy: (req as any).user?.id
  });

  await appointment.save();
  await appointment.populate('patient doctor');

  res.status(201).json({
    success: true,
    message: 'Appointment scheduled successfully',
    data: appointment
  });
});

/**
 * Update appointment details
 * @route PATCH /api/appointments/:id
 * @access Private
 */
export const updateAppointment = asyncHandler(async (req: Request, res: Response) => {
  const appointment = await Appointment.findByIdAndUpdate(
    req.params.id,
    req.body,
    { new: true, runValidators: true }
  ).populate('patient doctor');

  if (!appointment) {
    res.status(404).json({
      success: false,
      error: 'Appointment not found'
    });
    return;
  }

  res.status(200).json({
    success: true,
    message: 'Appointment updated successfully',
    data: appointment
  });
});

/**
 * Cancel appointment
 * @route DELETE /api/appointments/:id
 * @access Private
 */
export const cancelAppointment = asyncHandler(async (req: Request, res: Response) => {
  const { cancellationReason } = req.body;

  const appointment = await Appointment.findById(req.params.id);
  if (!appointment) {
    res.status(404).json({
      success: false,
      error: 'Appointment not found'
    });
    return;
  }

  // Type assertion to access instance methods
  const appointmentDoc = appointment as IAppointment & { canBeCancelled?: () => boolean };
  
  if (appointmentDoc.canBeCancelled && !appointmentDoc.canBeCancelled()) {
    res.status(400).json({
      success: false,
      error: 'Appointment cannot be cancelled (too close to scheduled time)'
    });
    return;
  }

  appointment.status = 'cancelled';
  appointment.cancellationReason = cancellationReason;
  await appointment.save();

  res.status(200).json({
    success: true,
    message: 'Appointment cancelled successfully',
    data: appointment
  });
});

/**
 * Get appointments for specific doctor
 * @route GET /api/appointments/doctor/:doctorId
 * @access Private
 */
export const getDoctorAppointments = asyncHandler(async (req: Request, res: Response) => {
  const { startDate, endDate } = req.query;
  const { doctorId } = req.params;

  const filter: AppointmentFilter = { doctor: doctorId };
  
  if (startDate && endDate) {
    filter.scheduledTime = {
      $gte: new Date(startDate as string),
      $lte: new Date(endDate as string)
    };
  }

  const appointments = await Appointment.find(filter)
    .populate('patient', 'firstName lastName phone')
    .sort({ scheduledTime: 1 });

  res.status(200).json({
    success: true,
    data: appointments,
    count: appointments.length
  });
});

/**
 * Check doctor availability
 * @route GET /api/appointments/availability
 * @access Private
 */
export const checkAvailability = asyncHandler(async (req: Request, res: Response) => {
  const { doctorId, startTime, duration } = req.query;

  const startDateTime = new Date(startTime as string);
  const durationNum = parseInt(duration as string);

  const conflictingAppointments = await (Appointment as any).findConflictingAppointments(
    doctorId as string,
    startDateTime,
    durationNum
  );

  const isAvailable = conflictingAppointments.length === 0;

  res.status(200).json({
    success: true,
    data: {
      available: isAvailable,
      conflicts: isAvailable ? [] : conflictingAppointments
    }
  });
});