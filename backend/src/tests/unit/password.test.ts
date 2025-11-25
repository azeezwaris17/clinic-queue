// src/tests/unit/password.test.ts
/**
 * Password Security Utility Tests
 * 
 * Tests password hashing, verification, and strength validation
 * to ensure secure authentication practices.
 */

import { describe, test, expect } from '@jest/globals';
import { 
  hashPassword, 
  verifyPassword, 
  validatePasswordStrength,
  generateTemporaryPassword 
} from '../../utils/password';

describe('Password Utilities', () => {
  describe('hashPassword', () => {
    test('should hash password successfully', async () => {
      const plainPassword = 'securePassword123';
      const hashedPassword = await hashPassword(plainPassword);
      
      expect(hashedPassword).toBeDefined();
      expect(hashedPassword).not.toBe(plainPassword);
      expect(hashedPassword.length).toBeGreaterThan(50); // bcrypt hash length
    });

    test('should reject short passwords', async () => {
      const shortPassword = '123';
      
      await expect(hashPassword(shortPassword)).rejects.toThrow('at least 6 characters');
    });
  });

  describe('verifyPassword', () => {
    test('should verify correct passwords', async () => {
      const plainPassword = 'testPassword123';
      const hashedPassword = await hashPassword(plainPassword);
      
      const isValid = await verifyPassword(plainPassword, hashedPassword);
      expect(isValid).toBe(true);
    });

    test('should reject incorrect passwords', async () => {
      const plainPassword = 'testPassword123';
      const hashedPassword = await hashPassword(plainPassword);
      
      const isValid = await verifyPassword('wrongPassword', hashedPassword);
      expect(isValid).toBe(false);
    });
  });

  describe('validatePasswordStrength', () => {
    test('should accept strong passwords', () => {
      const strongPasswords = [
        'SecurePass123',
        'Very$ecureP@ssw0rd',
        '12345Abcde!'
      ];
      
      strongPasswords.forEach(password => {
        const result = validatePasswordStrength(password);
        expect(result.isValid).toBe(true);
        expect(result.errors).toHaveLength(0);
      });
    });

    test('should reject short passwords', () => {
      const result = validatePasswordStrength('123');
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('at least 6 characters');
    });
  });

  describe('generateTemporaryPassword', () => {
    test('should generate password of correct length', () => {
      const password = generateTemporaryPassword(12);
      
      expect(password).toHaveLength(12);
      expect(typeof password).toBe('string');
    });
  });
});