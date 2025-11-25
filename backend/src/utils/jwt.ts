// backend/src/utils/jwt.ts

/**
 * JSON Web Token (JWT) Utility Functions
 * 
 * Provides secure token generation and verification for authentication.
 * Handles token signing, verification, and decoding with configurable
 * expiration times. Used for staff authentication and patient tracking tokens.
 */

import jwt from 'jsonwebtoken';

/**
 * JWT Configuration
 * 
 * Uses environment variable for secret key with fallback for development.
 * In production, JWT_SECRET must be set as environment variable.
 */
const JWT_CONFIG = {
  secret: process.env.JWT_SECRET || 'clinic-queue-dev-secret-change-in-production',
  defaultExpiresIn: process.env.JWT_EXPIRES_IN || '24h',
  trackingTokenExpiresIn: '8h' // Shorter expiry for patient tracking tokens
} as const;

/**
 * JWT Payload Interface
 * 
 * Defines the structure of data encoded in JWT tokens
 */
export interface JWTPayload {
  id: string;           // User ID (staff ID or visit ID)
  email?: string;       // Staff email (not included in patient tokens)
  role?: string;        // Staff role (doctor, nurse, admin, etc.)
  [key: string]: any;   // Additional claims
}

/**
 * Tracking Token Payload Interface
 * 
 * Specific payload structure for patient tracking tokens
 */
export interface TrackingTokenPayload {
  visitId: string;
  patientId: string;
  triageLevel: string;
  type: string;
  id: string; // Required by JWTPayload interface
}

/**
 * Generates a JWT token with the provided payload
 * 
 * @param payload - Data to encode in the token (user ID, email, role, etc.)
 * @param expiresIn - Token expiration time (default: 24h)
 * @returns Signed JWT token string
 * 
 * @example
 * // Staff login token
 * const token = signToken({ id: '123', email: 'doctor@clinic.com', role: 'doctor' });
 * 
 * @example
 * // Patient tracking token (shorter expiry)
 * const trackingToken = signToken({ visitId: '456', patientId: '789' }, '8h');
 */
export const signToken = (
  payload: JWTPayload, 
  expiresIn: string = JWT_CONFIG.defaultExpiresIn
): string => {
  // Validate that secret is configured (especially in production)
  if (JWT_CONFIG.secret.includes('change-in-production') && process.env.NODE_ENV === 'production') {
    throw new Error('JWT_SECRET must be set in production environment');
  }

  // Sign the token with payload and configuration
  return jwt.sign(payload, JWT_CONFIG.secret, { 
    expiresIn,
    issuer: 'clinic-queue-api',
    audience: 'clinic-queue-client'
  } as jwt.SignOptions);
};

/**
 * Verifies and decodes a JWT token
 * 
 * @param token - JWT token string to verify
 * @returns Decoded token payload if valid, null if invalid/expired
 * 
 * @throws {Error} If token verification fails unexpectedly
 * 
 * @example
 * const decoded = verifyToken('eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...');
 * if (decoded) {
 *   console.log('User ID:', decoded.id);
 * }
 */
export const verifyToken = (token: string): JWTPayload | null => {
  try {
    // Verify token signature and decode payload
    const decoded = jwt.verify(token, JWT_CONFIG.secret, {
      issuer: 'clinic-queue-api',
      audience: 'clinic-queue-client'
    } as jwt.VerifyOptions) as JWTPayload;
    
    return decoded;
  } catch (error) {
    // Handle specific JWT error types
    if (error instanceof jwt.JsonWebTokenError) {
      console.warn('🔐 JWT verification failed:', error.message);
      return null;
    }
    
    if (error instanceof jwt.TokenExpiredError) {
      console.warn('🔐 JWT token expired:', error.message);
      return null;
    }
    
    // Re-throw unexpected errors
    console.error('🔐 JWT verification error:', error);
    throw error;
  }
};

/**
 * Decodes a JWT token without verification
 * 
 * WARNING: This only decodes the token, does not verify the signature.
 * Only use for extracting information from tokens you trust.
 * 
 * @param token - JWT token string to decode
 * @returns Decoded token payload or null if invalid format
 * 
 * @example
 * // Use for debugging or reading token content (without verification)
 * const payload = decodeToken(token);
 * console.log('Token expires at:', new Date(payload.exp * 1000));
 */
export const decodeToken = (token: string): JWTPayload | null => {
  try {
    return jwt.decode(token) as JWTPayload;
  } catch (error) {
    console.warn('🔐 JWT decoding failed:', error);
    return null;
  }
};

/**
 * Generates a patient tracking token for visit status updates
 * 
 * @param visitId - MongoDB Visit document ID
 * @param patientId - MongoDB Patient document ID  
 * @param triageLevel - Patient's triage priority level
 * @returns JWT token with shorter expiry for patient tracking
 */
export const generateTrackingToken = (
  visitId: string, 
  patientId: string, 
  triageLevel: string
): string => {
  const trackingPayload: TrackingTokenPayload = {
    visitId, 
    patientId, 
    triageLevel,
    type: 'tracking', // Distinguish from staff authentication tokens
    id: visitId // Use visitId as the required id field
  };
  
  return signToken(
    trackingPayload,
    JWT_CONFIG.trackingTokenExpiresIn
  );
};

/**
 * Extracts token from Authorization header
 * 
 * @param authHeader - Authorization header value (format: "Bearer <token>")
 * @returns Token string or null if header is invalid
 */
export const extractTokenFromHeader = (authHeader: string | undefined): string | null => {
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }
  
  return authHeader.slice(7); // Remove "Bearer " prefix
};