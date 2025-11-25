// backend/src/models/Patient.ts
/**
 * Patient Data Model
 * 
 * Defines the schema and interface for patient records in the ClinicQueue system.
 * Stores demographic information, contact details, medical history, and emergency contacts.
 * Used for patient registration, check-ins, and medical record keeping.
 */

import mongoose, { Schema, Document } from 'mongoose';

/**
 * Interface representing a Patient document in MongoDB
 * Extends Mongoose Document for built-in methods and properties
 */
export interface IPatient extends Document {
  // Personal Identification
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  dateOfBirth: Date;
  gender: 'male' | 'female' | 'other';
  
  // Contact Information
  address: string;
  city: string;
  state: string;
  zipCode: string;
  
  // Medical Information
  insuranceId?: string; // Optional insurance identifier
  allergies: string[]; // List of known allergies
  currentMedications: string[]; // Current medication list
  medicalHistory: string[]; // Past medical conditions
  
  // Emergency Contact
  emergencyContact: {
    name: string;
    relationship: string;
    phone: string;
  };
  
  // Timestamps (automatically managed by Mongoose)
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Mongoose Schema definition for Patient collection
 * Enforces data validation, indexing, and structure
 */
const PatientSchema = new Schema<IPatient>(
  {
    // Personal Identification Fields
    firstName: { 
      type: String, 
      required: [true, 'First name is required'],
      trim: true,
      maxlength: [50, 'First name cannot exceed 50 characters']
    },
    lastName: { 
      type: String, 
      required: [true, 'Last name is required'],
      trim: true,
      maxlength: [50, 'Last name cannot exceed 50 characters']
    },
    email: { 
      type: String, 
      required: [true, 'Email is required'],
      unique: true, // Prevent duplicate patient records
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Please enter a valid email address']
    },
    phone: { 
      type: String, 
      required: [true, 'Phone number is required'],
      trim: true
    },
    dateOfBirth: { 
      type: Date, 
      required: [true, 'Date of birth is required'],
      validate: {
        validator: (dob: Date) => dob < new Date(),
        message: 'Date of birth must be in the past'
      }
    },
    gender: { 
      type: String, 
      enum: {
        values: ['male', 'female', 'other'],
        message: 'Gender must be male, female, or other'
      },
      required: [true, 'Gender is required']
    },
    
    // Contact Information Fields
    address: { 
      type: String, 
      required: [true, 'Address is required'],
      trim: true
    },
    city: { 
      type: String, 
      required: [true, 'City is required'],
      trim: true
    },
    state: { 
      type: String, 
      required: [true, 'State is required'],
      trim: true
    },
    zipCode: { 
      type: String, 
      required: [true, 'ZIP code is required'],
      match: [/^\d{5}(-\d{4})?$/, 'Please enter a valid ZIP code']
    },
    
    // Medical Information Fields
    insuranceId: { 
      type: String, 
      trim: true 
    },
    allergies: { 
      type: [String], 
      default: [] // Initialize as empty array
    },
    currentMedications: { 
      type: [String], 
      default: [] 
    },
    medicalHistory: { 
      type: [String], 
      default: [] 
    },
    
    // Emergency Contact Sub-document
    emergencyContact: {
      name: { 
        type: String, 
        required: [true, 'Emergency contact name is required'],
        trim: true
      },
      relationship: { 
        type: String, 
        required: [true, 'Emergency contact relationship is required'],
        trim: true
      },
      phone: { 
        type: String, 
        required: [true, 'Emergency contact phone is required'],
        trim: true
      }
    }
  },
  { 
    // Enable automatic timestamp management
    timestamps: true 
  }
);

/**
 * Compound index for efficient patient searching
 * Allows quick lookups by last name and first name
 */
PatientSchema.index({ lastName: 1, firstName: 1 });

/**
 * Text index for full-text search across patient information
 * Useful for search functionality in staff dashboard
 */
PatientSchema.index({ 
  firstName: 'text', 
  lastName: 'text', 
  email: 'text',
  phone: 'text'
});

// Create and export Mongoose model
export default mongoose.model<IPatient>('Patient', PatientSchema);