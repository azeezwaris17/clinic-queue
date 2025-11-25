// backend/src/utils/password.ts

/**
 * Password Security Utility Functions
 * 
 * Provides secure password hashing and verification using bcryptjs.
 * Implements industry-standard password security practices including
 * salting and adaptive hashing for protection against brute force attacks.
 */

import bcrypt from 'bcryptjs';

/**
 * Password Security Configuration
 * 
 * Salt rounds determine the computational cost of hashing.
 * Higher values are more secure but slower. 10-12 is recommended.
 */
const PASSWORD_CONFIG = {
  saltRounds: parseInt(process.env.BCRYPT_SALT_ROUNDS || '10', 10),
  minPasswordLength: 6
} as const;

/**
 * Hashes a plain text password using bcrypt
 * 
 * @param password - Plain text password to hash
 * @returns Promise resolving to hashed password string
 * 
 * @throws {Error} If password is too short or hashing fails
 * 
 * @example
 * const hashedPassword = await hashPassword('userPassword123');
 * await staff.save(); // Store hashed password in database
 */
export const hashPassword = async (password: string): Promise<string> => {
  // Validate password meets minimum requirements
  if (!password || password.length < PASSWORD_CONFIG.minPasswordLength) {
    throw new Error(`Password must be at least ${PASSWORD_CONFIG.minPasswordLength} characters long`);
  }

  try {
    // Generate salt and hash password
    const salt = await bcrypt.genSalt(PASSWORD_CONFIG.saltRounds);
    const hashedPassword = await bcrypt.hash(password, salt);
    
    return hashedPassword;
  } catch (error) {
    console.error('🔐 Password hashing failed:', error);
    throw new Error('Failed to secure password');
  }
};

/**
 * Verifies a plain text password against a hashed password
 * 
 * @param password - Plain text password to verify
 * @param hashedPassword - Hashed password from database
 * @returns Promise resolving to boolean indicating if password matches
 * 
 * @example
 * const isValid = await verifyPassword('inputPassword', storedHashedPassword);
 * if (isValid) {
 *   // Grant access
 * }
 */
export const verifyPassword = async (
  password: string, 
  hashedPassword: string
): Promise<boolean> => {
  // Basic validation
  if (!password || !hashedPassword) {
    return false;
  }

  try {
    // Compare password with hash using constant-time comparison
    const isValid = await bcrypt.compare(password, hashedPassword);
    return isValid;
  } catch (error) {
    console.error('🔐 Password verification failed:', error);
    return false;
  }
};

/**
 * Validates password strength requirements
 * 
 * @param password - Password to validate
 * @returns Object with validation result and messages
 * 
 * @example
 * const validation = validatePasswordStrength('weak');
 * if (!validation.isValid) {
 *   console.log(validation.errors);
 * }
 */
export const validatePasswordStrength = (password: string): {
  isValid: boolean;
  errors: string[];
} => {
  const errors: string[] = [];

  // Check minimum length
  if (password.length < PASSWORD_CONFIG.minPasswordLength) {
    errors.push(`Password must be at least ${PASSWORD_CONFIG.minPasswordLength} characters long`);
  }

  // Check for at least one number
  if (!/\d/.test(password)) {
    errors.push('Password must contain at least one number');
  }

  // Check for at least one letter
  if (!/[a-zA-Z]/.test(password)) {
    errors.push('Password must contain at least one letter');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};

/**
 * Generates a random temporary password for staff account setup
 * 
 * @param length - Length of generated password (default: 12)
 * @returns Randomly generated password
 */
export const generateTemporaryPassword = (length: number = 12): string => {
  const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*';
  let password = '';
  
  for (let i = 0; i < length; i++) {
    const randomIndex = Math.floor(Math.random() * charset.length);
    password += charset[randomIndex];
  }
  
  return password;
};