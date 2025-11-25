// src/tests/unit/triage.test.ts
/**
 * Triage Scoring System Unit Tests
 * 
 * Tests the deterministic triage scoring algorithm with various
 * patient scenarios to ensure accurate priority level assignment.
 */

import { describe, test, expect } from '@jest/globals';
import { 
  calculateTriageScore, 
  calculateEstimatedWaitTime,
  validateVitals 
} from '../../utils/triage';

describe('Triage Scoring System', () => {
  describe('calculateTriageScore', () => {
    test('should assign HIGH priority for critical chest pain symptoms', () => {
      const input = {
        temperature: 104.5,
        heartRate: 130,
        bloodPressureSystolic: 180,
        bloodPressureDiastolic: 110,
        painLevel: 9,
        symptoms: 'chest pain and difficulty breathing'
      };

      const result = calculateTriageScore(input);

      expect(result.level).toBe('high');
      expect(result.score).toBeGreaterThanOrEqual(60);
    });

    test('should assign MEDIUM priority for moderate symptoms', () => {
      const input = {
        temperature: 100.8,
        heartRate: 95,
        bloodPressureSystolic: 135,
        bloodPressureDiastolic: 85,
        painLevel: 5,
        symptoms: 'headache and nausea'
      };

      const result = calculateTriageScore(input);

      expect(result.level).toBe('medium');
      expect(result.score).toBeGreaterThanOrEqual(30);
      expect(result.score).toBeLessThan(60);
    });

    test('should assign LOW priority for normal vitals and minor symptoms', () => {
      const input = {
        temperature: 98.6,
        heartRate: 72,
        bloodPressureSystolic: 120,
        bloodPressureDiastolic: 80,
        painLevel: 2,
        symptoms: 'routine check-up and mild cough'
      };

      const result = calculateTriageScore(input);

      expect(result.level).toBe('low');
      expect(result.score).toBeLessThan(30);
    });
  });

  describe('calculateEstimatedWaitTime', () => {
    test('should calculate correct wait time based on queue position', () => {
      const patientsAhead = 4;
      const avgConsultTime = 15;
      
      const waitTime = calculateEstimatedWaitTime(patientsAhead, avgConsultTime);
      
      expect(waitTime).toBe(60); // 4 patients × 15 minutes
    });
  });

  describe('validateVitals', () => {
    test('should validate normal vitals as valid', () => {
      const vitals = {
        temperature: 98.6,
        heartRate: 75,
        bloodPressureSystolic: 120,
        bloodPressureDiastolic: 80,
        painLevel: 3
      };

      const result = validateVitals(vitals);

      expect(result.isValid).toBe(true);
      expect(result.warnings).toHaveLength(0);
    });

    test('should flag physiologically impossible low temperature', () => {
      const vitals = {
        temperature: 50,
        heartRate: 75,
        bloodPressureSystolic: 120,
        bloodPressureDiastolic: 80,
        painLevel: 3
      };

      const result = validateVitals(vitals);

      expect(result.isValid).toBe(false);
      expect(result.warnings[0]).toContain('outside expected range');
    });
  });
});