// backend/src/utils/triage.ts
/**
 * Triage Scoring System Utility
 * 
 * Implements a deterministic, rule-based scoring system to prioritize
 * patients based on vital signs and symptoms. Calculates triage levels
 * (high, medium, low) and estimated wait times for queue management.
 */

/**
 * Interface for triage input data
 * Contains all vital signs and symptoms needed for scoring
 */
export interface TriageInput {
  temperature: number;           // Fahrenheit
  heartRate: number;             // Beats per minute (BPM)
  bloodPressureSystolic: number; // mmHg
  bloodPressureDiastolic: number; // mmHg
  painLevel: number;             // 0-10 scale
  symptoms: string;              // Patient-reported symptoms description
}

/**
 * Interface for triage calculation results
 */
export interface TriageResult {
  score: number;                 // Calculated triage score (0-100+)
  level: 'high' | 'medium' | 'low'; // Priority level
  factors: string[];             // Contributing factors for transparency
}

/**
 * Triage Scoring Configuration
 * 
 * Defines scoring rules and thresholds for different vital sign ranges
 * and symptom patterns. Based on established emergency department protocols.
 */
const TRIAGE_RULES = {
  // Temperature scoring (normal: 98.6°F)
  temperature: {
    critical: { range: [103, 95], points: 30 },     // >103°F or <95°F
    serious: { range: [101.5, 96], points: 20 },    // 101.5-103°F or 95-96°F  
    moderate: { range: [100, 97], points: 10 },     // 100-101.5°F or 96-97°F
  },
  
  // Heart rate scoring (normal: 60-100 BPM)
  heartRate: {
    critical: { range: [120, 50], points: 25 },     // >120 BPM or <50 BPM
    serious: { range: [110, 55], points: 15 },      // 110-120 BPM or 50-55 BPM
    moderate: { range: [100, 60], points: 5 },      // 100-110 BPM or 55-60 BPM
  },
  
  // Blood pressure scoring (normal: 120/80 mmHg)
  bloodPressure: {
    systolicCritical: 40,  // Points for >40 mmHg deviation
    diastolicCritical: 30, // Points for >30 mmHg deviation
    systolicSerious: 25,   // Points for >25 mmHg deviation  
    diastolicSerious: 20,  // Points for >20 mmHg deviation
    systolicModerate: 10,  // Points for >10 mmHg deviation
    diastolicModerate: 10, // Points for >10 mmHg deviation
  },
  
  // Pain level scoring (0-10 scale)
  pain: {
    severe: { threshold: 8, points: 20 },    // 8-10: Severe pain
    moderate: { threshold: 5, points: 10 },  // 5-7: Moderate pain
    mild: { threshold: 1, points: 3 },       // 1-4: Mild pain
  },
  
  // Symptom keyword scoring
  symptoms: {
    critical: {
      keywords: ['chest pain', 'difficulty breathing', 'severe bleeding', 'unconscious', 'stroke', 'heart attack'],
      points: 40
    },
    serious: {
      keywords: ['broken bone', 'severe injury', 'poisoning', 'shock', 'seizure', 'allergic reaction'],
      points: 25
    }
  },
  
  // Triage level thresholds
  thresholds: {
    high: 60,    // Score ≥ 60: High priority (immediate attention)
    medium: 30   // Score 30-59: Medium priority (urgent)
    // Score < 30: Low priority (routine)
  }
} as const;

/**
 * Calculates triage score and priority level based on patient data
 * 
 * @param input - Patient vital signs and symptoms
 * @returns TriageResult with score, level, and contributing factors
 * 
 * @example
 * const result = calculateTriageScore({
 *   temperature: 101.5,
 *   heartRate: 95,
 *   bloodPressureSystolic: 140,
 *   bloodPressureDiastolic: 90, 
 *   painLevel: 7,
 *   symptoms: 'chest pain and shortness of breath'
 * });
 * // Returns: { score: 85, level: 'high', factors: [...] }
 */
export function calculateTriageScore(input: TriageInput): TriageResult {
  let score = 0;
  const factors: string[] = [];

  // Temperature scoring
  if (input.temperature >= TRIAGE_RULES.temperature.critical.range[0] || 
      input.temperature <= TRIAGE_RULES.temperature.critical.range[1]) {
    score += TRIAGE_RULES.temperature.critical.points;
    factors.push(`Critical temperature: ${input.temperature}°F`);
  } else if (input.temperature >= TRIAGE_RULES.temperature.serious.range[0] || 
             input.temperature <= TRIAGE_RULES.temperature.serious.range[1]) {
    score += TRIAGE_RULES.temperature.serious.points;
    factors.push(`Elevated temperature: ${input.temperature}°F`);
  } else if (input.temperature >= TRIAGE_RULES.temperature.moderate.range[0] || 
             input.temperature <= TRIAGE_RULES.temperature.moderate.range[1]) {
    score += TRIAGE_RULES.temperature.moderate.points;
    factors.push(`Mild temperature abnormality: ${input.temperature}°F`);
  }

  // Heart rate scoring
  if (input.heartRate >= TRIAGE_RULES.heartRate.critical.range[0] || 
      input.heartRate <= TRIAGE_RULES.heartRate.critical.range[1]) {
    score += TRIAGE_RULES.heartRate.critical.points;
    factors.push(`Critical heart rate: ${input.heartRate} BPM`);
  } else if (input.heartRate >= TRIAGE_RULES.heartRate.serious.range[0] || 
             input.heartRate <= TRIAGE_RULES.heartRate.serious.range[1]) {
    score += TRIAGE_RULES.heartRate.serious.points;
    factors.push(`Elevated heart rate: ${input.heartRate} BPM`);
  } else if (input.heartRate >= TRIAGE_RULES.heartRate.moderate.range[0] || 
             input.heartRate <= TRIAGE_RULES.heartRate.moderate.range[1]) {
    score += TRIAGE_RULES.heartRate.moderate.points;
    factors.push(`Mild heart rate abnormality: ${input.heartRate} BPM`);
  }

  // Blood pressure scoring
  const systolicDelta = Math.abs(input.bloodPressureSystolic - 120);
  const diastolicDelta = Math.abs(input.bloodPressureDiastolic - 80);

  if (systolicDelta >= TRIAGE_RULES.bloodPressure.systolicCritical || 
      diastolicDelta >= TRIAGE_RULES.bloodPressure.diastolicCritical) {
    score += TRIAGE_RULES.bloodPressure.systolicCritical; // Use systolic as point value
    factors.push(`Critical blood pressure: ${input.bloodPressureSystolic}/${input.bloodPressureDiastolic} mmHg`);
  } else if (systolicDelta >= TRIAGE_RULES.bloodPressure.systolicSerious || 
             diastolicDelta >= TRIAGE_RULES.bloodPressure.diastolicSerious) {
    score += TRIAGE_RULES.bloodPressure.systolicSerious;
    factors.push(`Elevated blood pressure: ${input.bloodPressureSystolic}/${input.bloodPressureDiastolic} mmHg`);
  } else if (systolicDelta >= TRIAGE_RULES.bloodPressure.systolicModerate || 
             diastolicDelta >= TRIAGE_RULES.bloodPressure.diastolicModerate) {
    score += TRIAGE_RULES.bloodPressure.systolicModerate;
    factors.push(`Mild blood pressure abnormality: ${input.bloodPressureSystolic}/${input.bloodPressureDiastolic} mmHg`);
  }

  // Pain level scoring
  if (input.painLevel >= TRIAGE_RULES.pain.severe.threshold) {
    score += TRIAGE_RULES.pain.severe.points;
    factors.push(`Severe pain level: ${input.painLevel}/10`);
  } else if (input.painLevel >= TRIAGE_RULES.pain.moderate.threshold) {
    score += TRIAGE_RULES.pain.moderate.points;
    factors.push(`Moderate pain level: ${input.painLevel}/10`);
  } else if (input.painLevel >= TRIAGE_RULES.pain.mild.threshold) {
    score += TRIAGE_RULES.pain.mild.points;
    factors.push(`Mild pain level: ${input.painLevel}/10`);
  }

  // Symptom keyword scoring
  const lowerSymptoms = input.symptoms.toLowerCase();
  
  // Check for critical symptoms
  const hasCriticalSymptom = TRIAGE_RULES.symptoms.critical.keywords.some(
    keyword => lowerSymptoms.includes(keyword.toLowerCase())
  );
  
  if (hasCriticalSymptom) {
    score += TRIAGE_RULES.symptoms.critical.points;
    factors.push('Critical symptoms detected');
  } else {
    // Check for serious symptoms (only if no critical symptoms)
    const hasSeriousSymptom = TRIAGE_RULES.symptoms.serious.keywords.some(
      keyword => lowerSymptoms.includes(keyword.toLowerCase())
    );
    
    if (hasSeriousSymptom) {
      score += TRIAGE_RULES.symptoms.serious.points;
      factors.push('Serious symptoms detected');
    }
  }

  // Determine triage level based on total score
  let level: 'high' | 'medium' | 'low';
  if (score >= TRIAGE_RULES.thresholds.high) {
    level = 'high';
  } else if (score >= TRIAGE_RULES.thresholds.medium) {
    level = 'medium';
  } else {
    level = 'low';
  }

  return {
    score: Math.round(score), // Round to whole number for clarity
    level,
    factors
  };
}

/**
 * Calculates estimated wait time based on queue position
 * 
 * @param numberAhead - Number of patients waiting ahead in queue
 * @param avgConsultTimeMinutes - Average consultation time per patient (default: 15)
 * @returns Estimated wait time in minutes
 * 
 * @example
 * const waitTime = calculateEstimatedWaitTime(5, 15); // Returns 75 minutes
 */
export function calculateEstimatedWaitTime(
  numberAhead: number,
  avgConsultTimeMinutes: number = 15
): number {
  // Validate inputs
  if (numberAhead < 0) {
    throw new Error('Number of patients ahead cannot be negative');
  }
  
  if (avgConsultTimeMinutes <= 0) {
    throw new Error('Average consultation time must be positive');
  }

  // Calculate wait time: patients ahead × average consultation time
  const waitTime = numberAhead * avgConsultTimeMinutes;
  
  // Add buffer for high-priority patients who might be seen sooner
  const adjustedWaitTime = Math.max(waitTime, avgConsultTimeMinutes);
  
  return adjustedWaitTime;
}

/**
 * Validates vital sign ranges for clinical reasonableness
 * 
 * @param vitals - Patient vital signs to validate
 * @returns Validation result with any warnings
 */
export function validateVitals(vitals: {
  temperature: number;
  heartRate: number;
  bloodPressureSystolic: number;
  bloodPressureDiastolic: number;
  painLevel: number;
}): { isValid: boolean; warnings: string[] } {
  const warnings: string[] = [];

  // Temperature validation (90-110°F considered physiologically possible)
  if (vitals.temperature < 90 || vitals.temperature > 110) {
    warnings.push(`Temperature ${vitals.temperature}°F outside expected range (90-110°F)`);
  }

  // Heart rate validation (30-200 BPM considered possible)
  if (vitals.heartRate < 30 || vitals.heartRate > 200) {
    warnings.push(`Heart rate ${vitals.heartRate} BPM outside expected range (30-200 BPM)`);
  }

  // Blood pressure validation
  if (vitals.bloodPressureSystolic < 70 || vitals.bloodPressureSystolic > 250) {
    warnings.push(`Systolic BP ${vitals.bloodPressureSystolic} mmHg outside expected range (70-250 mmHg)`);
  }
  
  if (vitals.bloodPressureDiastolic < 40 || vitals.bloodPressureDiastolic > 150) {
    warnings.push(`Diastolic BP ${vitals.bloodPressureDiastolic} mmHg outside expected range (40-150 mmHg)`);
  }

  // Pain level validation
  if (vitals.painLevel < 0 || vitals.painLevel > 10) {
    warnings.push(`Pain level ${vitals.painLevel} outside valid range (0-10)`);
  }

  return {
    isValid: warnings.length === 0,
    warnings
  };
}