// backend/src/models/Visit.ts
/**
 * Visit Data Model
 * 
 * Represents a patient visit to the clinic, storing triage information,
 * vital signs, symptoms, and visit status. This is the core entity for
 * the queue management and triage scoring system.
 */

import mongoose, { Schema, Document } from 'mongoose';

/**
 * Interface representing a Visit document in MongoDB
 */
export interface IVisit extends Document {
  // References to related entities
  appointment: mongoose.Types.ObjectId; // Optional: link to scheduled appointment
  patient: mongoose.Types.ObjectId;     // Required: the patient being seen
  
  // Clinical Information
  symptoms: string;                     // Patient-reported symptoms
  vitals: {                            // Collected vital signs
    temperature: number;               // Fahrenheit
    heartRate: number;                 // BPM
    bloodPressureSystolic: number;     // mmHg
    bloodPressureDiastolic: number;    // mmHg
    painLevel: number;                 // 0-10 scale
  };
  
  // Triage Assessment
  triageLevel: 'high' | 'medium' | 'low'; // Priority level
  triageScore: number;                   // Calculated score (0-100+)
  estimatedWaitTime: number;             // Minutes until consultation
  
  // Visit Timeline
  checkInTime: Date;                    // When patient checked in
  completedAt?: Date;                   // When visit was completed
  notes?: string;                       // Clinical notes from staff
  
  // System Timestamps
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Visit schema with comprehensive medical data validation
 */
const VisitSchema = new Schema<IVisit>(
  {
    appointment: { 
      type: Schema.Types.ObjectId, 
      ref: 'Appointment' 
    },
    patient: { 
      type: Schema.Types.ObjectId, 
      ref: 'Patient', 
      required: true 
    },
    symptoms: { 
      type: String, 
      required: [true, 'Symptoms description is required'],
      trim: true,
      minlength: [5, 'Symptoms description must be at least 5 characters long']
    },
    vitals: {
      temperature: { 
        type: Number, 
        required: true,
        min: [90, 'Temperature too low'],
        max: [110, 'Temperature too high']
      },
      heartRate: { 
        type: Number, 
        required: true,
        min: [30, 'Heart rate too low'],
        max: [200, 'Heart rate too high']
      },
      bloodPressureSystolic: { 
        type: Number, 
        required: true,
        min: [70, 'Systolic BP too low'],
        max: [250, 'Systolic BP too high']
      },
      bloodPressureDiastolic: { 
        type: Number, 
        required: true,
        min: [40, 'Diastolic BP too low'],
        max: [150, 'Diastolic BP too high']
      },
      painLevel: { 
        type: Number, 
        required: true,
        min: [0, 'Pain level must be between 0-10'],
        max: [10, 'Pain level must be between 0-10']
      }
    },
    triageLevel: {
      type: String,
      enum: {
        values: ['high', 'medium', 'low'],
        message: 'Triage level must be high, medium, or low'
      },
      required: true
    },
    triageScore: { 
      type: Number, 
      required: true,
      min: [0, 'Triage score cannot be negative']
    },
    estimatedWaitTime: { 
      type: Number, 
      required: true,
      min: [0, 'Wait time cannot be negative']
    },
    checkInTime: { 
      type: Date, 
      default: Date.now 
    },
    completedAt: { 
      type: Date 
    },
    notes: { 
      type: String, 
      trim: true,
      maxlength: [1000, 'Notes cannot exceed 1000 characters']
    }
  },
  { 
    timestamps: true 
  }
);

/**
 * Index for efficient querying of active visits by triage level
 * Helps staff prioritize patients in the queue
 */
VisitSchema.index({ triageLevel: 1, checkInTime: 1 });

/**
 * Index for finding visits by patient and date range
 * Useful for patient history lookups
 */
VisitSchema.index({ patient: 1, checkInTime: -1 });

export default mongoose.model<IVisit>('Visit', VisitSchema);