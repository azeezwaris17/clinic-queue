// src/tests/integration/auth.test.ts
/**
 * Authentication Integration Tests
 * 
 * Tests the complete authentication flow including registration,
 * login, token verification, and password management.
 */

import { describe, beforeEach, test, expect } from '@jest/globals';
import request from 'supertest';
import app from '../../app';
import Staff from '../../models/Staff';
import { hashPassword } from '../../utils/password';

describe('Authentication Integration', () => {
  beforeEach(async () => {
    // Clear staff collection before each test
    await Staff.deleteMany({});
  });

  describe('POST /api/auth/register', () => {
    test('should register new staff member successfully', async () => {
      const staffData = {
        email: 'new.doctor@clinic.com',
        password: 'securePassword123',
        firstName: 'New',
        lastName: 'Doctor',
        role: 'doctor',
        phone: '5551234567',
        specialty: 'Cardiology'
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(staffData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Staff registration successful');
      expect(response.body.token).toBeDefined();
      expect(response.body.staff).toMatchObject({
        firstName: 'New',
        lastName: 'Doctor',
        email: 'new.doctor@clinic.com',
        role: 'doctor',
        specialty: 'Cardiology'
      });
      expect(response.body.staff.password).toBeUndefined(); // Password should not be returned

      // Verify staff was saved in database
      const savedStaff = await Staff.findOne({ email: 'new.doctor@clinic.com' });
      expect(savedStaff).toBeDefined();
      expect(savedStaff?.firstName).toBe('New');
      expect(savedStaff?.role).toBe('doctor');
    });

    test('should reject registration with existing email', async () => {
      // Create existing staff
      await Staff.create({
        firstName: 'Existing',
        lastName: 'Staff',
        email: 'existing@clinic.com',
        phone: '5551111111',
        role: 'nurse',
        password: await hashPassword('password123')
      });

      const staffData = {
        email: 'existing@clinic.com', // Same email
        password: 'newPassword123',
        firstName: 'New',
        lastName: 'User',
        role: 'doctor',
        phone: '5552222222',
        specialty: 'Pediatrics'
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(staffData)
        .expect(400);

      expect(response.body.error).toBeDefined();
      expect(response.body.message).toContain('already registered');
    });

    test('should reject registration with missing required fields', async () => {
      const incompleteData = {
        email: 'test@clinic.com',
        // Missing password, firstName, lastName, role, phone
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(incompleteData)
        .expect(400);

      expect(response.body.error).toBe('Missing required fields');
    });

    test('should require specialty for doctors', async () => {
      const doctorData = {
        email: 'doctor@clinic.com',
        password: 'password123',
        firstName: 'No',
        lastName: 'Specialty',
        role: 'doctor',
        phone: '5551234567'
        // Missing specialty
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(doctorData)
        .expect(400);

      expect(response.body.error).toContain('Specialty is required');
    });
  });

  describe('POST /api/auth/login', () => {
    beforeEach(async () => {
      // Create a test staff member for login tests
      await Staff.create({
        firstName: 'Test',
        lastName: 'Doctor',
        email: 'test.doctor@clinic.com',
        phone: '5551234567',
        role: 'doctor',
        specialty: 'General Medicine',
        password: await hashPassword('correctPassword123'),
        isActive: true
      });
    });

    test('should login successfully with correct credentials', async () => {
      const loginData = {
        email: 'test.doctor@clinic.com',
        password: 'correctPassword123'
      };

      const response = await request(app)
        .post('/api/auth/login')
        .send(loginData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Login successful');
      expect(response.body.token).toBeDefined();
      expect(response.body.staff).toMatchObject({
        firstName: 'Test',
        lastName: 'Doctor',
        email: 'test.doctor@clinic.com',
        role: 'doctor',
        specialty: 'General Medicine'
      });
    });

    test('should reject login with incorrect password', async () => {
      const loginData = {
        email: 'test.doctor@clinic.com',
        password: 'wrongPassword'
      };

      const response = await request(app)
        .post('/api/auth/login')
        .send(loginData)
        .expect(401);

      expect(response.body.error).toBeDefined();
      expect(response.body.message).toContain('Invalid credentials');
    });

    test('should reject login with non-existent email', async () => {
      const loginData = {
        email: 'nonexistent@clinic.com',
        password: 'anyPassword'
      };

      const response = await request(app)
        .post('/api/auth/login')
        .send(loginData)
        .expect(401);

      expect(response.body.error).toBeDefined();
    });

    test('should reject login for inactive accounts', async () => {
      // Create inactive staff member
      await Staff.create({
        firstName: 'Inactive',
        lastName: 'Staff',
        email: 'inactive@clinic.com',
        phone: '5559999999',
        role: 'nurse',
        password: await hashPassword('password123'),
        isActive: false
      });

      const loginData = {
        email: 'inactive@clinic.com',
        password: 'password123'
      };

      const response = await request(app)
        .post('/api/auth/login')
        .send(loginData)
        .expect(401);

      expect(response.body.error).toContain('deactivated');
    });
  });

  describe('POST /api/auth/verify', () => {
    test('should verify valid token', async () => {
      // First login to get a token
      await Staff.create({
        firstName: 'Verify',
        lastName: 'Test',
        email: 'verify@clinic.com',
        phone: '5551234567',
        role: 'doctor',
        specialty: 'Test',
        password: await hashPassword('password123')
      });

      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'verify@clinic.com',
          password: 'password123'
        });

      const token = loginResponse.body.token;

      // Now verify the token
      const verifyResponse = await request(app)
        .post('/api/auth/verify')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(verifyResponse.body.success).toBe(true);
      expect(verifyResponse.body.valid).toBe(true);
      expect(verifyResponse.body.user).toBeDefined();
    });

    test('should reject invalid token', async () => {
      const response = await request(app)
        .post('/api/auth/verify')
        .set('Authorization', 'Bearer invalid.token.here')
        .expect(401);

      expect(response.body.error).toBeDefined();
    });

    test('should reject request without token', async () => {
      const response = await request(app)
        .post('/api/auth/verify')
        .expect(401);

      expect(response.body.error).toBeDefined();
    });
  });
});