// src/tests/unit/jwt.test.ts
/**
 * JWT Utility Tests
 * 
 * Tests JSON Web Token generation, verification, and security features
 * used for staff authentication and patient tracking.
 */

import { describe, test, expect } from '@jest/globals';
import { 
  signToken, 
  verifyToken, 
  decodeToken,
  generateTrackingToken 
} from '../../utils/jwt';

describe('JWT Utilities', () => {
  const testPayload = {
    id: '507f1f77bcf86cd799439011',
    email: 'test.doctor@clinic.com',
    role: 'doctor'
  };

  describe('signToken', () => {
    test('should generate a valid JWT token', () => {
      const token = signToken(testPayload);
      
      expect(typeof token).toBe('string');
      expect(token.split('.')).toHaveLength(3); // JWT has 3 parts
      expect(token.length).toBeGreaterThan(50);
    });

    test('should generate tokens with custom expiration', () => {
      const shortToken = signToken(testPayload, '1h');
      const longToken = signToken(testPayload, '7d');
      
      expect(typeof shortToken).toBe('string');
      expect(typeof longToken).toBe('string');
    });

    test('should include all payload data in token', () => {
      const token = signToken(testPayload);
      const decoded = decodeToken(token);
      
      expect(decoded).toMatchObject({
        id: testPayload.id,
        email: testPayload.email,
        role: testPayload.role
      });
    });
  });

  describe('verifyToken', () => {
    test('should verify valid tokens correctly', () => {
      const token = signToken(testPayload);
      const verified = verifyToken(token);
      
      expect(verified).toBeTruthy();
      expect(verified).toMatchObject(testPayload);
    });

    test('should reject invalid tokens', () => {
      const invalidToken = 'invalid.token.here';
      const verified = verifyToken(invalidToken);
      
      expect(verified).toBeNull();
    });

    test('should reject tampered tokens', () => {
      const token = signToken(testPayload);
      const tamperedToken = token.slice(0, -5) + 'tampered';
      const verified = verifyToken(tamperedToken);
      
      expect(verified).toBeNull();
    });

    test('should reject expired tokens', () => {
      // Create a token that expired 1 second ago
      const expiredPayload = { ...testPayload, exp: Math.floor(Date.now() / 1000) - 1 };
      const jwt = require('jsonwebtoken');
      const expiredToken = jwt.sign(expiredPayload, process.env.JWT_SECRET || 'test-secret');
      
      const verified = verifyToken(expiredToken);
      
      expect(verified).toBeNull();
    });
  });

  describe('decodeToken', () => {
    test('should decode token without verification', () => {
      const token = signToken(testPayload);
      const decoded = decodeToken(token);
      
      expect(decoded).toMatchObject(testPayload);
    });

    test('should return null for malformed tokens', () => {
      const malformedToken = 'malformed.token';
      const decoded = decodeToken(malformedToken);
      
      expect(decoded).toBeNull();
    });
  });

  describe('generateTrackingToken', () => {
    test('should generate patient tracking token', () => {
      const visitId = '507f1f77bcf86cd799439012';
      const patientId = '507f1f77bcf86cd799439013';
      const triageLevel = 'medium';
      
      const trackingToken = generateTrackingToken(visitId, patientId, triageLevel);
      
      expect(typeof trackingToken).toBe('string');
      
      // Verify it can be decoded
      const decoded = decodeToken(trackingToken);
      expect(decoded).toMatchObject({
        visitId,
        patientId,
        triageLevel,
        type: 'tracking'
      });
    });
  });
});