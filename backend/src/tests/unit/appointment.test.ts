// src/tests/unit/appointment.test.ts
/**
 * Appointment Model Unit Tests
 * 
 * Tests Appointment model validation, business logic,
 * and relationship integrity.
 */

import { describe, beforeEach, test, expect } from '@jest/globals';
import Appointment from '../../models/Appointment';
import Staff from '../../models/Staff';
import Patient from '../../models/Patient';
import { hashPassword } from '../../utils/password';

describe('Appointment Model', () => {
  let testDoctor: any;
  let testPatient: any;
  let testStaff: any;

  beforeEach(async () => {
    // Create test doctor
    testDoctor = await Staff.create({
      firstName: 'Appointment',
      lastName: 'Doctor',
      email: 'appointment.doctor@clinic.com',
      phone: '5551234567',
      role: 'doctor',
      specialty: 'General Medicine',
      password: await hashPassword('password123')
    });

    // Create test patient
    testPatient = await Patient.create({
      firstName: 'Appointment',
      lastName: 'Patient',
      email: 'appointment.patient@example.com',
      phone: '5559876543',
      dateOfBirth: new Date('1990-01-01'),
      gender: 'male',
      address: '123 Test St',
      city: 'Test City',
      state: 'TS',
      zipCode: '12345',
      allergies: [],
      currentMedications: [],
      medicalHistory: [],
      emergencyContact: {
        name: 'Test Contact',
        relationship: 'Friend',
        phone: '5559999999'
      }
    });

    // Create test staff (non-doctor)
    testStaff = await Staff.create({
      firstName: 'Reception',
      lastName: 'Staff',
      email: 'reception@clinic.com',
      phone: '5551111111',
      role: 'receptionist',
      password: await hashPassword('password123')
    });
  });

  test('should create valid appointment', async () => {
    const appointmentData = {
      patient: testPatient._id,
      doctor: testDoctor._id,
      scheduledTime: new Date(Date.now() + 24 * 60 * 60 * 1000), // Tomorrow
      duration: 30,
      reasonForVisit: 'Annual physical examination',
      appointmentType: 'checkup',
      createdBy: testStaff._id
    };

    const appointment = new Appointment(appointmentData);
    const savedAppointment = await appointment.save();

    expect(savedAppointment._id).toBeDefined();
    expect(savedAppointment.status).toBe('scheduled');
    expect(savedAppointment.reasonForVisit).toBe('Annual physical examination');
    expect(savedAppointment.appointmentType).toBe('checkup');
  });

  test('should reject appointment with non-doctor staff', async () => {
    const appointmentData = {
      patient: testPatient._id,
      doctor: testStaff._id, // This staff is a receptionist, not doctor
      scheduledTime: new Date(Date.now() + 24 * 60 * 60 * 1000),
      reasonForVisit: 'Test appointment',
      createdBy: testStaff._id
    };

    await expect(Appointment.create(appointmentData)).rejects.toThrow();
  });

  test('should reject appointment in the past', async () => {
    const appointmentData = {
      patient: testPatient._id,
      doctor: testDoctor._id,
      scheduledTime: new Date(Date.now() - 24 * 60 * 60 * 1000), // Yesterday
      reasonForVisit: 'Test appointment',
      createdBy: testStaff._id
    };

    await expect(Appointment.create(appointmentData)).rejects.toThrow();
  });

  test('should calculate end time correctly', async () => {
    const startTime = new Date('2024-01-20T10:00:00Z');
    const appointment = new Appointment({
      patient: testPatient._id,
      doctor: testDoctor._id,
      scheduledTime: startTime,
      duration: 45,
      reasonForVisit: 'Test appointment',
      createdBy: testStaff._id
    });

    const endTime = appointment.endTime;
    expect(endTime.getTime()).toBe(startTime.getTime() + 45 * 60 * 1000);
  });

  test('should detect upcoming appointments', async () => {
    const soon = new Date(Date.now() + 30 * 60 * 1000); // 30 minutes from now
    const appointment = new Appointment({
      patient: testPatient._id,
      doctor: testDoctor._id,
      scheduledTime: soon,
      reasonForVisit: 'Test appointment',
      createdBy: testStaff._id
    });

    expect(appointment.isUpcoming).toBe(true);
  });
});