// src/tests/unit/models.test.ts
/**
 * Database Model Tests
 * 
 * Tests Mongoose models for data validation, relationships,
 * and business logic enforcement.
 */

import { describe, beforeEach, test, expect } from '@jest/globals';
import Staff from '../../models/Staff';
import Patient from '../../models/Patient';
import Visit from '../../models/Visit';
import { hashPassword } from '../../utils/password';

describe('Database Models', () => {
  describe('Staff Model', () => {
    test('should create staff member with required fields', async () => {
      const staffData = {
        firstName: 'John',
        lastName: 'Doctor',
        email: 'john.doctor@clinic.com',
        phone: '5551234567',
        role: 'doctor',
        specialty: 'Cardiology',
        password: await hashPassword('password123')
      };

      const staff = new Staff(staffData);
      const savedStaff = await staff.save();

      expect(savedStaff._id).toBeDefined();
      expect(savedStaff.firstName).toBe('John');
      expect(savedStaff.email).toBe('john.doctor@clinic.com');
      expect(savedStaff.role).toBe('doctor');
      expect(savedStaff.specialty).toBe('Cardiology');
      expect(savedStaff.isActive).toBe(true);
      expect(savedStaff.password).not.toBe('password123'); // Should be hashed
    });

    test('should require specialty for doctors', async () => {
      const staffData = {
        firstName: 'No',
        lastName: 'Specialty',
        email: 'no.specialty@clinic.com',
        phone: '5551234567',
        role: 'doctor',
        password: await hashPassword('password123')
        // Missing specialty
      };

      await expect(Staff.create(staffData)).rejects.toThrow();
    });

    test('should not require specialty for non-doctors', async () => {
      const staffData = {
        firstName: 'Nurse',
        lastName: 'Staff',
        email: 'nurse@clinic.com',
        phone: '5551234567',
        role: 'nurse',
        password: await hashPassword('password123')
        // No specialty for nurse
      };

      const staff = await Staff.create(staffData);
      expect(staff.specialty).toBeUndefined();
    });
  });

  describe('Patient Model', () => {
    test('should create patient with required fields', async () => {
      const patientData = {
        firstName: 'Alice',
        lastName: 'Patient',
        email: 'alice.patient@example.com',
        phone: '5559876543',
        dateOfBirth: new Date('1990-05-15'),
        gender: 'female',
        address: '123 Main Street',
        city: 'Springfield',
        state: 'IL',
        zipCode: '62701',
        allergies: ['Penicillin'],
        currentMedications: ['Vitamin D'],
        medicalHistory: ['Hypertension'],
        emergencyContact: {
          name: 'Bob Patient',
          relationship: 'Husband',
          phone: '5551111111'
        }
      };

      const patient = new Patient(patientData);
      const savedPatient = await patient.save();

      expect(savedPatient._id).toBeDefined();
      expect(savedPatient.firstName).toBe('Alice');
      expect(savedPatient.email).toBe('alice.patient@example.com');
      expect(savedPatient.gender).toBe('female');
      expect(savedPatient.allergies).toContain('Penicillin');
      expect(savedPatient.emergencyContact.name).toBe('Bob Patient');
    });
  });

  describe('Visit Model', () => {
    let testPatient: any;

    beforeEach(async () => {
      testPatient = await Patient.create({
        firstName: 'Visit',
        lastName: 'Test',
        email: 'visit.test@example.com',
        phone: '5551234567',
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
    });

    test('should create visit with required fields', async () => {
      const visitData = {
        patient: testPatient._id,
        symptoms: 'Fever and cough for 2 days',
        vitals: {
          temperature: 101.5,
          heartRate: 95,
          bloodPressureSystolic: 130,
          bloodPressureDiastolic: 85,
          painLevel: 6
        },
        triageLevel: 'medium',
        triageScore: 45,
        estimatedWaitTime: 30,
        checkInTime: new Date()
      };

      const visit = new Visit(visitData);
      const savedVisit = await visit.save();

      expect(savedVisit._id).toBeDefined();
      expect(savedVisit.symptoms).toBe('Fever and cough for 2 days');
      expect(savedVisit.triageLevel).toBe('medium');
      expect(savedVisit.triageScore).toBe(45);
      expect(savedVisit.vitals.temperature).toBe(101.5);
      expect(savedVisit.vitals.painLevel).toBe(6);
    });
  });
});