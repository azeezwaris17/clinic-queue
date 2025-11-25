// backend/src/services/staff.service.ts
/**
 * Staff Management Service
 * 
 * Handles business logic for staff registration, profile management,
 * role-based access control, and staff directory operations.
 * Separates staff-related business logic from route handlers.
 */

import Staff, { IStaff } from '../models/Staff';
import bcrypt from 'bcryptjs';

/**
 * Staff registration data interface
 */
export interface StaffRegistrationData {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  phone: string;
  role: 'doctor' | 'nurse' | 'receptionist' | 'admin';
  specialty?: string;
  licenseNumber?: string;
  department?: string;
  hireDate: string; // ISO date string
  emergencyContact?: {
    name: string;
    relationship: string;
    phone: string;
  };
}

/**
 * Staff profile update data interface
 */
export interface StaffProfileUpdate {
  firstName?: string;
  lastName?: string;
  phone?: string;
  specialty?: string;
  department?: string;
  emergencyContact?: {
    name: string;
    relationship: string;
    phone: string;
  };
}

/**
 * Staff search criteria interface
 */
export interface StaffSearchCriteria {
  role?: string;
  department?: string;
  isActive?: boolean;
  query?: string;
  page?: number;
  limit?: number;
}

/**
 * Staff statistics interface
 */
export interface StaffStatistics {
  totalStaff: number;
  byRole: { [key: string]: number };
  byDepartment: { [key: string]: number };
  activeStaff: number;
  newHiresThisMonth: number;
}

/**
 * Staff Service Class
 * 
 * Encapsulates all staff-related business logic
 */
export class StaffService {
  /**
   * Registers a new staff member
   * 
   * @param data - Staff registration data
   * @returns Created staff record (without password)
   * @throws {Error} If validation fails or staff already exists
   */
  static async registerStaff(data: StaffRegistrationData): Promise<Omit<IStaff, 'password'>> {
    const {
      email,
      password,
      role,
      licenseNumber,
      hireDate
    } = data;

    // Check if staff already exists with same email
    const existingStaff = await Staff.findOne({ email });
    if (existingStaff) {
      throw new Error('Staff member with this email already exists');
    }

    // Validate role-specific requirements
    if (role === 'doctor' && !licenseNumber) {
      throw new Error('License number is required for doctors');
    }

    // Validate hire date
    const hireDateObj = new Date(hireDate);
    if (hireDateObj > new Date()) {
      throw new Error('Hire date cannot be in the future');
    }

    // Hash password
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    const staff = new Staff({
      ...data,
      password: hashedPassword,
      hireDate: hireDateObj
    });

    await staff.save();

    // Return staff without password
    const staffObject = staff.toObject();
    delete (staffObject as any).password;

    return staffObject;
  }

  /**
   * Updates staff profile information
   * 
   * @param staffId - Staff ID to update
   * @param updates - Fields to update
   * @param isAdmin - Whether requester is admin
   * @returns Updated staff record
   * @throws {Error} If staff not found or validation fails
   */
  static async updateStaffProfile(
    staffId: string,
    updates: StaffProfileUpdate,
    isAdmin: boolean = false
  ): Promise<Omit<IStaff, 'password'>> {
    // Non-admin users cannot update certain fields
    const updateData = { ...updates };
    if (!isAdmin) {
      delete (updateData as any).role;
      delete (updateData as any).isActive;
    }

    const staff = await Staff.findByIdAndUpdate(
      staffId,
      updateData,
      { new: true, runValidators: true }
    ).select('-password');

    if (!staff) {
      throw new Error('Staff member not found');
    }

    return staff;
  }

  /**
   * Updates staff role and active status (admin only)
   * 
   * @param staffId - Staff ID to update
   * @param role - New role
   * @param isActive - Active status
   * @returns Updated staff record
   * @throws {Error} If staff not found or invalid role
   */
  static async updateStaffRole(
    staffId: string,
    role: string,
    isActive: boolean
  ): Promise<Omit<IStaff, 'password'>> {
    const validRoles = ['doctor', 'nurse', 'receptionist', 'admin'];
    if (!validRoles.includes(role)) {
      throw new Error('Invalid role');
    }

    const staff = await Staff.findByIdAndUpdate(
      staffId,
      { role, isActive },
      { new: true, runValidators: true }
    ).select('-password');

    if (!staff) {
      throw new Error('Staff member not found');
    }

    return staff;
  }

  /**
   * Changes staff password
   * 
   * @param staffId - Staff ID
   * @param currentPassword - Current password
   * @param newPassword - New password
   * @returns Success status
   * @throws {Error} If staff not found or current password incorrect
   */
  static async changePassword(
    staffId: string,
    currentPassword: string,
    newPassword: string
  ): Promise<{ success: boolean; message: string }> {
    const staff = await Staff.findById(staffId);
    
    if (!staff) {
      throw new Error('Staff member not found');
    }

    // Verify current password
    const isCurrentPasswordValid = await bcrypt.compare(currentPassword, staff.password);
    if (!isCurrentPasswordValid) {
      throw new Error('Current password is incorrect');
    }

    // Hash new password
    const saltRounds = 12;
    const hashedNewPassword = await bcrypt.hash(newPassword, saltRounds);

    staff.password = hashedNewPassword;
    await staff.save();

    return {
      success: true,
      message: 'Password changed successfully'
    };
  }

  /**
   * Gets staff members with filtering and pagination
   * 
   * @param criteria - Search criteria
   * @returns Paginated staff members
   */
  static async getStaff(criteria: StaffSearchCriteria = {}): Promise<{
    staff: Array<Omit<IStaff, 'password'>>;
    total: number;
    page: number;
    pages: number;
  }> {
    const {
      role,
      department,
      isActive = true,
      query,
      page = 1,
      limit = 20
    } = criteria;

    const skip = (page - 1) * limit;
    
    // Build filter object
    const filter: any = { isActive };

    if (role) {
      filter.role = role;
    }

    if (department) {
      filter.department = department;
    }

    if (query) {
      filter.$or = [
        { firstName: { $regex: query, $options: 'i' } },
        { lastName: { $regex: query, $options: 'i' } },
        { email: { $regex: query, $options: 'i' } }
      ];
    }

    const staff = await Staff.find(filter)
      .select('-password -__v')
      .sort({ role: 1, lastName: 1, firstName: 1 })
      .skip(skip)
      .limit(limit);

    const total = await Staff.countDocuments(filter);

    return {
      staff,
      total,
      page,
      pages: Math.ceil(total / limit)
    };
  }

  /**
   * Gets all active doctors
   * 
   * @returns List of active doctors
   */
  static async getDoctors(): Promise<Array<Omit<IStaff, 'password'>>> {
    const doctors = await Staff.find({ 
      role: 'doctor',
      isActive: true 
    })
    .select('firstName lastName specialty email phone department licenseNumber')
    .sort({ lastName: 1, firstName: 1 });

    return doctors;
  }

  /**
   * Gets staff member by ID
   * 
   * @param staffId - Staff ID
   * @returns Staff record
   * @throws {Error} If staff not found
   */
  static async getStaffById(staffId: string): Promise<Omit<IStaff, 'password'>> {
    const staff = await Staff.findById(staffId)
      .select('-password -__v');

    if (!staff) {
      throw new Error('Staff member not found');
    }

    return staff;
  }

  /**
   * Deactivates a staff member
   * 
   * @param staffId - Staff ID to deactivate
   * @returns Deactivated staff record
   * @throws {Error} If staff not found
   */
  static async deactivateStaff(staffId: string): Promise<Omit<IStaff, 'password'>> {
    const staff = await Staff.findByIdAndUpdate(
      staffId,
      { isActive: false },
      { new: true }
    ).select('-password -__v');

    if (!staff) {
      throw new Error('Staff member not found');
    }

    return staff;
  }

  /**
   * Reactivates a staff member
   * 
   * @param staffId - Staff ID to reactivate
   * @returns Reactivated staff record
   * @throws {Error} If staff not found
   */
  static async reactivateStaff(staffId: string): Promise<Omit<IStaff, 'password'>> {
    const staff = await Staff.findByIdAndUpdate(
      staffId,
      { isActive: true },
      { new: true }
    ).select('-password -__v');

    if (!staff) {
      throw new Error('Staff member not found');
    }

    return staff;
  }

  /**
   * Gets staff statistics for dashboard
   * 
   * @returns Staff statistics
   */
  static async getStaffStatistics(): Promise<StaffStatistics> {
    const totalStaff = await Staff.countDocuments();

    // Active staff count
    const activeStaff = await Staff.countDocuments({ isActive: true });

    // New hires this month
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const newHiresThisMonth = await Staff.countDocuments({
      hireDate: { $gte: startOfMonth }
    });

    // Distribution by role
    const roleDistribution = await Staff.aggregate([
      {
        $group: {
          _id: '$role',
          count: { $sum: 1 }
        }
      }
    ]);

    // Distribution by department
    const departmentDistribution = await Staff.aggregate([
      {
        $match: {
          department: { $exists: true, $ne: null }
        }
      },
      {
        $group: {
          _id: '$department',
          count: { $sum: 1 }
        }
      }
    ]);

    // Format distributions as objects
    const byRole = roleDistribution.reduce((acc, item) => {
      acc[item._id] = item.count;
      return acc;
    }, {} as { [key: string]: number });

    const byDepartment = departmentDistribution.reduce((acc, item) => {
      acc[item._id] = item.count;
      return acc;
    }, {} as { [key: string]: number });

    return {
      totalStaff,
      activeStaff,
      newHiresThisMonth,
      byRole,
      byDepartment
    };
  }

  /**
   * Searches staff by name or email
   * 
   * @param query - Search query
   * @returns Search results
   */
  static async searchStaff(query: string): Promise<Array<Omit<IStaff, 'password'>>> {
    const staff = await Staff.find({
      $or: [
        { firstName: { $regex: query, $options: 'i' } },
        { lastName: { $regex: query, $options: 'i' } },
        { email: { $regex: query, $options: 'i' } }
      ],
      isActive: true
    })
    .select('firstName lastName email phone role specialty department')
    .sort({ lastName: 1, firstName: 1 })
    .limit(10);

    return staff;
  }

  /**
   * Verifies staff credentials for login
   * 
   * @param email - Staff email
   * @param password - Staff password
   * @returns Staff record if credentials valid
   * @throws {Error} If credentials invalid
   */
  static async verifyCredentials(email: string, password: string): Promise<Omit<IStaff, 'password'>> {
    const staff = await Staff.findOne({ email, isActive: true });
    
    if (!staff) {
      throw new Error('Invalid email or password');
    }

    const isPasswordValid = await bcrypt.compare(password, staff.password);
    if (!isPasswordValid) {
      throw new Error('Invalid email or password');
    }

    // Return staff without password
    const staffObject = staff.toObject();
    delete (staffObject as any).password;

    return staffObject;
  }
}