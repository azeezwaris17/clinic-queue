// backend/src/models/Queue.ts
/**
 * Queue Management Data Model
 * 
 * Manages real-time patient queue for the clinic, tracking patient
 * progression from check-in to consultation completion. Integrates
 * with triage system to prioritize emergency cases and optimize
 * healthcare provider workflow.
 */

import mongoose, { Schema, Document, Types, Model } from 'mongoose';

/**
 * Interface representing a Queue entry document in MongoDB
 */
export interface IQueue extends Document {
  // Core Relationship References
  visit: Types.ObjectId;
  patient: Types.ObjectId;
  appointment?: Types.ObjectId;
  doctor?: Types.ObjectId;
  
  // Queue Position & Status
  position: number;
  status: 'waiting' | 'in-progress' | 'completed' | 'cancelled';
  priority: 'high' | 'medium' | 'low';
  
  // Timing Information
  checkInTime: Date;
  calledTime?: Date;
  consultationStartTime?: Date;
  consultationEndTime?: Date;
  
  // Performance Metrics
  estimatedWaitTime: number;
  actualWaitTime?: number;
  consultationDuration?: number;
  
  // Administrative Fields
  assignedRoom?: string;
  notes?: string;
  
  // System Timestamps
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Interface for Queue Model Static Methods
 */
export interface IQueueModel extends Model<IQueue> {
  getCurrentQueue(): Promise<IQueue[]>;
  getQueueStats(): Promise<any[]>;
  getNextPosition(): Promise<number>;
  recalculatePositions(): Promise<void>;
}

/**
 * Mongoose Schema for Queue collection
 */
const QueueSchema = new Schema<IQueue, IQueueModel>(
  {
    // Core Relationship References
    visit: { 
      type: Schema.Types.ObjectId, 
      ref: 'Visit', 
      required: [true, 'Visit reference is required'],
      unique: true,
      index: true
    },
    patient: { 
      type: Schema.Types.ObjectId, 
      ref: 'Patient', 
      required: [true, 'Patient reference is required'],
      index: true
    },
    appointment: { 
      type: Schema.Types.ObjectId, 
      ref: 'Appointment',
      index: true
    },
    doctor: { 
      type: Schema.Types.ObjectId, 
      ref: 'Staff',
      validate: {
        validator: async function(doctorId: Types.ObjectId) {
          if (!doctorId) return true;
          const Staff = mongoose.model('Staff');
          const staff = await Staff.findById(doctorId);
          return staff && staff.role === 'doctor';
        },
        message: 'Assigned staff member must be a doctor'
      },
      index: true
    },
    
    // Queue Position & Status
    position: { 
      type: Number, 
      required: [true, 'Queue position is required'],
      min: [1, 'Queue position must be at least 1'],
      index: true
    },
    status: {
      type: String,
      enum: {
        values: ['waiting', 'in-progress', 'completed', 'cancelled'],
        message: 'Status must be: waiting, in-progress, completed, or cancelled'
      },
      default: 'waiting',
      index: true
    },
    priority: {
      type: String,
      enum: {
        values: ['high', 'medium', 'low'],
        message: 'Priority must be: high, medium, or low'
      },
      required: [true, 'Priority level is required'],
      index: true
    },
    
    // Timing Information
    checkInTime: { 
      type: Date, 
      default: Date.now,
      index: true
    },
    calledTime: { 
      type: Date 
    },
    consultationStartTime: { 
      type: Date 
    },
    consultationEndTime: { 
      type: Date 
    },
    
    // Performance Metrics
    estimatedWaitTime: { 
      type: Number, 
      required: [true, 'Estimated wait time is required'],
      min: [0, 'Estimated wait time cannot be negative']
    },
    actualWaitTime: { 
      type: Number, 
      min: [0, 'Actual wait time cannot be negative']
    },
    consultationDuration: { 
      type: Number, 
      min: [0, 'Consultation duration cannot be negative']
    },
    
    // Administrative Fields
    assignedRoom: { 
      type: String, 
      trim: true,
      maxlength: [20, 'Room assignment cannot exceed 20 characters']
    },
    notes: { 
      type: String, 
      trim: true,
      maxlength: [1000, 'Queue notes cannot exceed 1000 characters']
    }
  },
  { 
    timestamps: true 
  }
);

// ... rest of your schema definitions (indexes, virtuals, etc.) remain the same ...

/**
 * Static Methods for Queue Operations
 */

// Get current active queue (waiting and in-progress patients)
QueueSchema.statics.getCurrentQueue = async function(): Promise<IQueue[]> {
  return this.find({
    status: { $in: ['waiting', 'in-progress'] }
  })
  .populate('patient', 'firstName lastName dateOfBirth gender')
  .populate('visit', 'symptoms triageLevel triageScore vitals')
  .populate('doctor', 'firstName lastName specialty')
  .populate('appointment', 'scheduledTime reasonForVisit')
  .sort({ 
    status: -1,
    priority: -1,
    position: 1
  });
};

// Get queue statistics for dashboard
QueueSchema.statics.getQueueStats = async function(): Promise<any[]> {
  return this.aggregate([
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 },
        avgWaitTime: { 
          $avg: {
            $cond: [
              { $eq: ['$status', 'waiting'] },
              { $subtract: [new Date(), '$checkInTime'] },
              '$actualWaitTime'
            ]
          }
        }
      }
    },
    {
      $group: {
        _id: null,
        total: { $sum: '$count' },
        byStatus: {
          $push: {
            status: '$_id',
            count: '$count',
            avgWaitTime: { $divide: ['$avgWaitTime', 60000] }
          }
        }
      }
    },
    {
      $project: {
        _id: 0,
        total: 1,
        byStatus: 1
      }
    }
  ]);
};

// Get next position in queue
QueueSchema.statics.getNextPosition = async function(): Promise<number> {
  const lastQueueEntry = await this.findOne(
    { status: 'waiting' },
    { position: 1 },
    { sort: { position: -1 } }
  );
  
  return (lastQueueEntry?.position || 0) + 1;
};

// Recalculate positions after queue changes
QueueSchema.statics.recalculatePositions = async function(): Promise<void> {
  const waitingPatients = await this.find(
    { status: 'waiting' }
  ).sort({ 
    priority: -1, 
    checkInTime: 1 
  });

  for (let i = 0; i < waitingPatients.length; i++) {
    await this.findByIdAndUpdate(
      waitingPatients[i]._id,
      { position: i + 1 }
    );
  }
};

// ... rest of your middleware and virtuals remain the same ...

export default mongoose.model<IQueue, IQueueModel>('Queue', QueueSchema);