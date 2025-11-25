// backend/src/services/auth.service.ts
/**
 * Authentication Service
 * 
 * Handles staff authentication business logic including registration,
 * login, token management, and credential verification. Separates
 * authentication concerns from route handlers for better testability.
 */

import Staff from '../models/Staff';
import { hashPassword, verifyPassword, validatePasswordStrength } from '../utils/password';
import { signToken, generateTrackingToken } from '../utils/jwt';
import { hasExistingAdmin } from '../utils/adminSetup';

/**
 * Staff registration data interface
 */
interface RegisterData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  role: 'doctor' | 'nurse' | 'receptionist' | 'admin';
  phone: string;
  specialty?: string; // Required for doctors
}

/**
 * Staff login data interface  
 */
interface LoginData {
  email: string;
  password: string;
}

/**
 * Authentication response interface
 */
interface AuthResponse {
  token: string;
  staff: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    role: string;
    specialty?: string | undefined; // Add undefined to the type
  };
}

/**
 * Authentication Service Class
 * 
 * Encapsulates all authentication-related business logic
 */
export class AuthService {
  /**
   * Registers a new staff member in the system
   * 
   * @param data - Staff registration data
   * @returns Authentication response with token and staff data
   * @throws {Error} If email already exists or validation fails
   */
  static async register(data: RegisterData): Promise<AuthResponse> {
    const { email, password, firstName, lastName, role, phone, specialty } = data;

    // Validate required fields
    if (!email || !password || !firstName || !lastName || !role || !phone) {
      throw new Error('All required fields must be provided');
    }

    // Validate password strength
    const passwordValidation = validatePasswordStrength(password);
    if (!passwordValidation.isValid) {
      throw new Error(`Password validation failed: ${passwordValidation.errors.join(', ')}`);
    }

    // Check if staff member already exists
    const existingStaff = await Staff.findOne({ email });
    if (existingStaff) {
      throw new Error('Email address already registered');
    }

    // Validate specialty for doctors
    if (role === 'doctor' && !specialty) {
      throw new Error('Specialty is required for doctor role');
    }

    // Hash password for secure storage
    const hashedPassword = await hashPassword(password);

    // Create new staff record
    const staff = new Staff({
      email,
      password: hashedPassword,
      firstName,
      lastName,
      role,
      phone,
      specialty: role === 'doctor' ? specialty : undefined,
      isActive: true
    });

    await staff.save();

    // Generate authentication token
    const token = signToken({
      id: staff._id.toString(),
      email: staff.email,
      role: staff.role
    });

    // Return authentication response (excluding password)
    return {
      token,
      staff: {
        id: staff._id.toString(),
        firstName: staff.firstName,
        lastName: staff.lastName,
        email: staff.email,
        role: staff.role,
        specialty: staff.specialty || undefined // Ensure undefined instead of null
      }
    };
  }

  /**
   * Registers a new admin (only allowed by existing admins)
   * 
   * @param data - Admin registration data
   * @param requestingAdminId - ID of the admin making the request
   * @returns Authentication response with token and admin data
   * @throws {Error} If insufficient permissions or validation fails
   */
  static async registerAdmin(data: RegisterData, requestingAdminId: string): Promise<AuthResponse> {
    // Verify requesting user is an admin
    const requestingAdmin = await Staff.findById(requestingAdminId);
    if (!requestingAdmin || requestingAdmin.role !== 'admin') {
      throw new Error('Insufficient permissions: Only admins can register new admins');
    }

    // Ensure the new user has admin role
    if (data.role !== 'admin') {
      throw new Error('Admin registration must have admin role');
    }

    return this.register(data);
  }

  /**
   * Registers first staff member (auto-assigns admin role if no admins exist)
   * 
   * @param data - Staff registration data
   * @returns Authentication response with token and staff data
   * @throws {Error} If registration fails
   */
  static async registerFirstStaff(data: RegisterData): Promise<AuthResponse> {
    const adminExists = await hasExistingAdmin();
    
    // If no admin exists, first registrant becomes admin
    const registrationData = {
      ...data,
      role: adminExists ? data.role : 'admin'
    };

    const result = await this.register(registrationData);
    
    if (!adminExists) {
      console.log(`✅ First admin created: ${data.email}`);
    }
    
    return result;
  }

  /**
   * Authenticates staff member and returns token
   * 
   * @param data - Staff login credentials
   * @returns Authentication response with token and staff data
   * @throws {Error} If credentials are invalid or account is inactive
   */
  static async login(data: LoginData): Promise<AuthResponse> {
    const { email, password } = data;

    // Validate required fields
    if (!email || !password) {
      throw new Error('Email and password are required');
    }

    // Find staff member by email
    const staff = await Staff.findOne({ email });
    if (!staff) {
      throw new Error('Invalid credentials');
    }

    // Check if account is active
    if (!staff.isActive) {
      throw new Error('Account is deactivated. Please contact administrator.');
    }

    // Verify password
    const isValidPassword = await verifyPassword(password, staff.password);
    if (!isValidPassword) {
      throw new Error('Invalid credentials');
    }

    // Generate authentication token
    const token = signToken({
      id: staff._id.toString(),
      email: staff.email,
      role: staff.role
    });

    // Return authentication response
    return {
      token,
      staff: {
        id: staff._id.toString(),
        firstName: staff.firstName,
        lastName: staff.lastName,
        email: staff.email,
        role: staff.role,
        specialty: staff.specialty || undefined // Ensure undefined instead of null
      }
    };
  }

  /**
   * Verifies JWT token and returns staff data
   * 
   * @param token - JWT token to verify
   * @returns Staff data if token is valid
   * @throws {Error} If token is invalid or staff not found
   */
  static async verifyToken(token: string): Promise<{
    id: string;
    email: string;
    role: string;
  }> {
    // Import here to avoid circular dependency
    const { verifyToken } = await import('../utils/jwt');
    
    const decoded = verifyToken(token);
    if (!decoded) {
      throw new Error('Invalid or expired token');
    }

    // Verify staff still exists and is active
    const staff = await Staff.findById(decoded.id);
    if (!staff) {
      throw new Error('Staff account not found');
    }

    if (!staff.isActive) {
      throw new Error('Staff account is deactivated');
    }

    return {
      id: staff._id.toString(),
      email: staff.email,
      role: staff.role
    };
  }

  /**
   * Changes staff member's password
   * 
   * @param staffId - Staff member ID
   * @param currentPassword - Current password for verification
   * @param newPassword - New password to set
   * @throws {Error} If current password is wrong or new password is invalid
   */
  static async changePassword(
    staffId: string, 
    currentPassword: string, 
    newPassword: string
  ): Promise<void> {
    // Find staff member
    const staff = await Staff.findById(staffId);
    if (!staff) {
      throw new Error('Staff account not found');
    }

    // Verify current password
    const isCurrentValid = await verifyPassword(currentPassword, staff.password);
    if (!isCurrentValid) {
      throw new Error('Current password is incorrect');
    }

    // Validate new password strength
    const passwordValidation = validatePasswordStrength(newPassword);
    if (!passwordValidation.isValid) {
      throw new Error(`New password validation failed: ${passwordValidation.errors.join(', ')}`);
    }

    // Hash and update new password
    const hashedNewPassword = await hashPassword(newPassword);
    staff.password = hashedNewPassword;
    
    await staff.save();
  }

  /**
   * Generates a tracking token for patient visit status
   * 
   * @param visitId - Visit ID
   * @param patientId - Patient ID
   * @param triageLevel - Triage priority level
   * @returns JWT tracking token
   */
  static generatePatientTrackingToken(
    visitId: string, 
    patientId: string, 
    triageLevel: string
  ): string {
    return generateTrackingToken(visitId, patientId, triageLevel);
  }
}