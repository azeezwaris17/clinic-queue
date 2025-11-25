// backend/src/models/Staff.ts
/**
 * Staff Data Model
 * 
 * Defines the schema for healthcare staff members including doctors, nurses,
 * receptionists, and administrators. Handles authentication credentials and
 * role-based access control for the ClinicQueue system.
 */

import mongoose, { Schema, Document } from 'mongoose';

/**
 * Interface representing a Staff member document in MongoDB
 */
export interface IStaff extends Document {
  // Personal Information
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  
  // Role and Specialty
  role: 'doctor' | 'nurse' | 'receptionist' | 'admin';
  specialty?: string; // Only required for doctors
  
  // Authentication
  password: string;
  
  // Account Status
  isActive: boolean;
  
  // Timestamps
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Staff schema with role-based validation and authentication support
 */
const StaffSchema = new Schema<IStaff>(
  {
    firstName: { 
      type: String, 
      required: [true, 'First name is required'],
      trim: true
    },
    lastName: { 
      type: String, 
      required: [true, 'Last name is required'],
      trim: true
    },
    email: { 
      type: String, 
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Please enter a valid email address']
    },
    phone: { 
      type: String, 
      required: [true, 'Phone number is required'],
      trim: true
    },
    role: {
      type: String,
      enum: {
        values: ['doctor', 'nurse', 'receptionist', 'admin'],
        message: 'Role must be doctor, nurse, receptionist, or admin'
      },
      required: [true, 'Role is required']
    },
    specialty: {
      type: String,
      required: function(this: IStaff) {
        // Specialty is required only for doctors
        return this.role === 'doctor';
      },
      trim: true
    },
    password: { 
      type: String, 
      required: [true, 'Password is required'],
      minlength: [6, 'Password must be at least 6 characters long']
    },
    isActive: { 
      type: Boolean, 
      default: true // Staff accounts are active by default
    }
  },
  { 
    timestamps: true 
  }
);

/**
 * Index for efficient staff lookup by role and specialty
 * Useful for assigning doctors to specific departments
 */
StaffSchema.index({ role: 1, specialty: 1 });

/**
 * Virtual field for full name (not stored in database)
 * Provides convenient access to staff member's full name
 */
StaffSchema.virtual('fullName').get(function(this: IStaff) {
  return `${this.firstName} ${this.lastName}`;
});

// Ensure virtual fields are serialized when converting to JSON
StaffSchema.set('toJSON', {
  virtuals: true,
  transform: function (_doc: unknown, ret: { __v?: number }) {
    // Remove internal fields from API responses
    const { __v, ...rest } = ret;
    return rest;
  },
});

export default mongoose.model<IStaff>('Staff', StaffSchema);