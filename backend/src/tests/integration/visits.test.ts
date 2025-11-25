// src/tests/integration/visits.test.ts
/**
 * Patient Check-in Integration Tests
 * 
 * Tests the complete patient check-in flow including triage scoring,
 * queue management, and visit creation.
 */

import { describe, beforeEach, test, expect } from '@jest/globals';
import request from 'supertest';
import app from '../../app';
import Patient from '../../models/Patient';
import Visit from '../../models/Visit';
import Queue from '../../models/Queue';

describe('Patient Check-in Integration', () => {
  beforeEach(async () => {
    // Clear collections before each test
    await Patient.deleteMany({});
    await Visit.deleteMany({});
    await Queue.deleteMany({});
  });

  describe('POST /api/visits/check-in', () => {
    test('should complete patient check-in successfully', async () => {
      const checkInData = {
        firstName: 'John',
        lastName: 'Doe',
        email: 'john.doe@example.com',
        phone: '5551234567',
        dateOfBirth: '1990-01-01',
        gender: 'male',
        symptoms: 'Fever, headache, and sore throat for 3 days',
        temperature: 101.2,
        heartRate: 88,
        bloodPressureSystolic: 130,
        bloodPressureDiastolic: 85,
        painLevel: 5,
        allergies: 'Penicillin',
        medications: 'Ibuprofen as needed'
      };

      const response = await request(app)
        .post('/api/visits/check-in')
        .send(checkInData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.trackingToken).toBeDefined();
      expect(response.body.visit).toMatchObject({
        triageLevel: expect.stringMatching(/^(high|medium|low)$/),
        triageScore: expect.any(Number),
        estimatedWaitTime: expect.any(Number),
        position: 1 // First in queue
      });
      expect(response.body.patient).toMatchObject({
        firstName: 'John',
        lastName: 'Doe'
      });

      // Verify data was saved in database
      const patient = await Patient.findOne({ email: 'john.doe@example.com' });
      expect(patient).toBeDefined();
      expect(patient?.firstName).toBe('John');

      const visit = await Visit.findOne({ patient: patient?._id });
      expect(visit).toBeDefined();
      expect(visit?.triageLevel).toBe('medium'); // Based on the symptoms

      const queue = await Queue.findOne({ visit: visit?._id });
      expect(queue).toBeDefined();
      expect(queue?.position).toBe(1);
    });

    test('should handle existing patient check-in', async () => {
      // Create existing patient
      const existingPatient = await Patient.create({
        firstName: 'Existing',
        lastName: 'Patient',
        email: 'existing@example.com',
        phone: '5551111111',
        dateOfBirth: new Date('1985-05-15'),
        gender: 'female',
        address: '123 Main St',
        city: 'Test City',
        state: 'TS',
        zipCode: '12345',
        allergies: ['Shellfish'],
        currentMedications: [],
        medicalHistory: []
      });

      const checkInData = {
        firstName: 'Existing', // Same first name
        lastName: 'Patient',   // Same last name  
        email: 'existing@example.com', // Same email
        phone: '5559999999', // Different phone (should update)
        dateOfBirth: '1985-05-15',
        gender: 'female',
        symptoms: 'Follow-up visit',
        temperature: 98.6,
        heartRate: 72,
        bloodPressureSystolic: 120,
        bloodPressureDiastolic: 80,
        painLevel: 2
      };

      const response = await request(app)
        .post('/api/visits/check-in')
        .send(checkInData)
        .expect(201);

      expect(response.body.success).toBe(true);

      // Verify patient was updated
      const updatedPatient = await Patient.findById(existingPatient._id);
      expect(updatedPatient?.phone).toBe('5559999999'); // Phone should be updated
    });

    test('should reject check-in with invalid vital signs', async () => {
      const invalidCheckInData = {
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
        phone: '5551234567',
        dateOfBirth: '1990-01-01',
        gender: 'male',
        symptoms: 'Test symptoms',
        temperature: 50, // Invalid: too low
        heartRate: 20,   // Invalid: too low
        bloodPressureSystolic: 300, // Invalid: too high
        bloodPressureDiastolic: 200, // Invalid: too high
        painLevel: 15    // Invalid: out of range
      };

      const response = await request(app)
        .post('/api/visits/check-in')
        .send(invalidCheckInData)
        .expect(400);

      expect(response.body.error).toBeDefined();
      expect(response.body.message).toContain('Vital sign validation failed');
    });

    test('should calculate correct queue position', async () => {
      // Create first patient in queue
      await request(app)
        .post('/api/visits/check-in')
        .send({
          firstName: 'First',
          lastName: 'Patient',
          email: 'first@example.com',
          phone: '5551111111',
          dateOfBirth: '1990-01-01',
          gender: 'male',
          symptoms: 'First in queue',
          temperature: 98.6,
          heartRate: 72,
          bloodPressureSystolic: 120,
          bloodPressureDiastolic: 80,
          painLevel: 1
        });

      // Second patient should have position 2
      const response = await request(app)
        .post('/api/visits/check-in')
        .send({
          firstName: 'Second',
          lastName: 'Patient',
          email: 'second@example.com',
          phone: '5552222222',
          dateOfBirth: '1990-01-01',
          gender: 'female',
          symptoms: 'Second in queue',
          temperature: 98.6,
          heartRate: 72,
          bloodPressureSystolic: 120,
          bloodPressureDiastolic: 80,
          painLevel: 1
        })
        .expect(201);

      expect(response.body.visit.position).toBe(2);
    });
  });

  describe('GET /api/visits/:id', () => {
    test('should retrieve visit details by ID', async () => {
      // First create a visit
      const checkInResponse = await request(app)
        .post('/api/visits/check-in')
        .send({
          firstName: 'Test',
          lastName: 'Patient',
          email: 'test@example.com',
          phone: '5551234567',
          dateOfBirth: '1990-01-01',
          gender: 'male',
          symptoms: 'Test symptoms',
          temperature: 98.6,
          heartRate: 72,
          bloodPressureSystolic: 120,
          bloodPressureDiastolic: 80,
          painLevel: 3
        });

      const visitId = checkInResponse.body.visit.id;

      // Now retrieve the visit
      const response = await request(app)
        .get(`/api/visits/${visitId}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toMatchObject({
        _id: visitId,
        symptoms: 'Test symptoms',
        triageLevel: 'low'
      });
      expect(response.body.data.patient).toBeDefined();
    });

    test('should return 404 for non-existent visit', async () => {
      const nonExistentId = '507f1f77bcf86cd799439999';
      
      const response = await request(app)
        .get(`/api/visits/${nonExistentId}`)
        .expect(404);

      expect(response.body.error).toBeDefined();
    });
  });
});