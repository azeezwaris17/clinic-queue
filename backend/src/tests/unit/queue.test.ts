// src/tests/unit/queue.test.ts
/**
 * Queue Model Unit Tests
 * 
 * Tests Queue model functionality, position management,
 * and status transitions.
 */

import { describe, beforeEach, test, expect } from '@jest/globals';
import Queue from '../../models/Queue';
import Patient from '../../models/Patient';
import Visit from '../../models/Visit';
import Staff from '../../models/Staff';
import { hashPassword } from '../../utils/password';

describe('Queue Model', () => {
  let testPatient: any;
  let testVisit: any;

  beforeEach(async () => {
    // Create test patient
    testPatient = await Patient.create({
      firstName: 'Queue',
      lastName: 'Test',
      email: 'queue.test@example.com',
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

    // Create test visit
    testVisit = await Visit.create({
      patient: testPatient._id,
      symptoms: 'Queue test symptoms',
      vitals: {
        temperature: 98.6,
        heartRate: 72,
        bloodPressureSystolic: 120,
        bloodPressureDiastolic: 80,
        painLevel: 3
      },
      triageLevel: 'low',
      triageScore: 15,
      estimatedWaitTime: 30
    });
  });

  test('should create valid queue entry', async () => {
    const queueData = {
      visit: testVisit._id,
      patient: testPatient._id,
      position: 1,
      priority: 'low',
      estimatedWaitTime: 30
    };

    const queue = new Queue(queueData);
    const savedQueue = await queue.save();

    expect(savedQueue._id).toBeDefined();
    expect(savedQueue.status).toBe('waiting');
    expect(savedQueue.position).toBe(1);
    expect(savedQueue.priority).toBe('low');
  });
});