/**
 * Appointment Data Model
 *
 * Manages scheduled patient appointments with healthcare providers.
 * Supports appointment lifecycle from scheduling to completion,
 * including status tracking, rescheduling, and integration with
 * visit records for walk-in patients.
 */

import mongoose, { Schema, Document, Types, Model } from 'mongoose';

/**
 * Interface representing an Appointment document in MongoDB
 */
export interface IAppointment extends Document {
  patient: Types.ObjectId;
  doctor: Types.ObjectId;

  scheduledTime: Date;
  duration: number;
  status:
    | 'scheduled'
    | 'confirmed'
    | 'checked-in'
    | 'in-progress'
    | 'completed'
    | 'cancelled'
    | 'no-show';

  reasonForVisit: string;
  appointmentType:
    | 'checkup'
    | 'follow-up'
    | 'consultation'
    | 'procedure'
    | 'emergency';

  chiefComplaint?: string;
  notes?: string;
  preAppointmentInstructions?: string;

  isRecurring: boolean;
  recurrencePattern?: string;
  createdBy: Types.ObjectId;

  createdAt: Date;
  updatedAt: Date;
  cancelledAt?: Date | null;
  cancellationReason?: string | null;

  visit?: Types.ObjectId;
  reminderSent: boolean;

  endTime: Date;
  isUpcoming: boolean;
  isOverdue: boolean;

  canBeCancelled(): boolean;
  canBeRescheduled(): boolean;
}

interface IAppointmentModel extends Model<IAppointment> {
  findByDoctorAndDateRange(
    doctorId: Types.ObjectId,
    startDate: Date,
    endDate: Date
  ): Promise<IAppointment[]>;

  findConflictingAppointments(
    doctorId: Types.ObjectId,
    startTime: Date,
    duration: number
  ): Promise<IAppointment[]>;
}

/**
 * Schema
 */
const AppointmentSchema = new Schema<IAppointment, IAppointmentModel>(
  {
    patient: {
      type: Schema.Types.ObjectId,
      ref: 'Patient',
      required: true,
      index: true,
    },

    doctor: {
      type: Schema.Types.ObjectId,
      ref: 'Staff',
      required: true,
      validate: {
        validator: async function (doctorId: Types.ObjectId) {
          const Staff = mongoose.model('Staff');
          const staff = await Staff.findById(doctorId);
          return staff && staff.role === 'doctor';
        },
        message: 'Referenced staff member must be a doctor',
      },
      index: true,
    },

    scheduledTime: {
      type: Date,
      required: true,
      validate: {
        validator: (time: Date) => time > new Date(),
        message: 'Scheduled time must be in the future',
      },
      index: true,
    },

    duration: {
      type: Number,
      default: 30,
      min: 5,
      max: 240,
    },

    status: {
      type: String,
      enum: [
        'scheduled',
        'confirmed',
        'checked-in',
        'in-progress',
        'completed',
        'cancelled',
        'no-show',
      ],
      default: 'scheduled',
      index: true,
    },

    reasonForVisit: {
      type: String,
      required: true,
      trim: true,
      maxlength: 500,
    },

    appointmentType: {
      type: String,
      enum: ['checkup', 'follow-up', 'consultation', 'procedure', 'emergency'],
      default: 'consultation',
    },

    chiefComplaint: { type: String, trim: true, maxlength: 1000 },
    notes: { type: String, trim: true, maxlength: 2000 },
    preAppointmentInstructions: { type: String, trim: true, maxlength: 1000 },

    isRecurring: { type: Boolean, default: false },

    recurrencePattern: {
      type: String,
      trim: true,
      validate: {
        validator: function (this: IAppointment, pattern: string) {
          if (this.isRecurring) {
            return (
              !!pattern &&
              ['weekly', 'monthly', 'custom'].includes(pattern.toLowerCase())
            );
          }
          return true;
        },
        message:
          'Recurrence pattern must be weekly, monthly, or custom for recurring appointments',
      },
    },

    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'Staff',
      required: true,
    },

    visit: { type: Schema.Types.ObjectId, ref: 'Visit' },

    reminderSent: { type: Boolean, default: false },

    cancelledAt: { type: Date, default: null },

    cancellationReason: {
      type: String,
      trim: true,
      maxlength: 500,
      default: null,
      validate: {
        validator: function (this: IAppointment, reason: string) {
          if (this.status === 'cancelled') {
            return !!reason;
          }
          return true;
        },
        message: 'Cancellation reason is required when appointment is cancelled',
      },
    },
  },
  { timestamps: true }
);

/**
 * Indexes
 */
AppointmentSchema.index({ doctor: 1, scheduledTime: 1 });
AppointmentSchema.index({ patient: 1, scheduledTime: -1 });
AppointmentSchema.index({ status: 1, scheduledTime: 1 });
AppointmentSchema.index({ doctor: 1, status: 1, scheduledTime: 1 });

/**
 * Virtuals
 */
AppointmentSchema.virtual('endTime').get(function (this: IAppointment) {
  const end = new Date(this.scheduledTime);
  end.setMinutes(end.getMinutes() + this.duration);
  return end;
});

AppointmentSchema.virtual('isUpcoming').get(function (this: IAppointment) {
  const now = new Date();
  const oneHourFromNow = new Date(now.getTime() + 60 * 60 * 1000);
  return this.scheduledTime > now && this.scheduledTime <= oneHourFromNow;
});

AppointmentSchema.virtual('isOverdue').get(function (this: IAppointment) {
  const now = new Date();
  return (
    this.scheduledTime < now &&
    ['scheduled', 'confirmed'].includes(this.status)
  );
});

/**
 * Instance Methods
 */
AppointmentSchema.methods.canBeCancelled = function (): boolean {
  const now = new Date();
  const deadline = new Date(this.scheduledTime);
  deadline.setHours(deadline.getHours() - 2);
  return (
    now < deadline &&
    ['scheduled', 'confirmed'].includes(this.status)
  );
};

AppointmentSchema.methods.canBeRescheduled = function (): boolean {
  const now = new Date();
  const deadline = new Date(this.scheduledTime);
  deadline.setHours(deadline.getHours() - 1);
  return (
    now < deadline &&
    ['scheduled', 'confirmed'].includes(this.status)
  );
};

/**
 * Static Methods
 */
AppointmentSchema.statics.findByDoctorAndDateRange = function (
  doctorId: Types.ObjectId,
  start: Date,
  end: Date
) {
  return this.find({
    doctor: doctorId,
    scheduledTime: { $gte: start, $lte: end },
    status: {
      $in: ['scheduled', 'confirmed', 'checked-in', 'in-progress'],
    },
  })
    .populate('patient', 'firstName lastName phone email')
    .sort({ scheduledTime: 1 });
};

AppointmentSchema.statics.findConflictingAppointments = function (
  doctorId: Types.ObjectId,
  start: Date,
  duration: number
) {
  const end = new Date(start.getTime() + duration * 60000);

  return this.find({
    doctor: doctorId,
    status: {
      $in: ['scheduled', 'confirmed', 'checked-in', 'in-progress'],
    },
    $or: [
      { scheduledTime: { $gte: start, $lt: end } },
      {
        $expr: {
          $and: [
            {
              $lt: [
                { $add: ['$scheduledTime', { $multiply: ['$duration', 60000] }] },
                end,
              ],
            },
            {
              $gt: [
                { $add: ['$scheduledTime', { $multiply: ['$duration', 60000] }] },
                start,
              ],
            },
          ],
        },
      },
    ],
  });
};

/**
 * Middleware
 */
AppointmentSchema.pre('save', function (next) {
  if (this.isModified('status') && this.status === 'cancelled') {
    this.cancelledAt = new Date();
  }

  if (this.isModified('status') && this.status !== 'cancelled') {
    this.cancelledAt = null;
    this.cancellationReason = null;
  }

  next();
});

/**
 * Proper toJSON transform (Type-safe)
 */
AppointmentSchema.set('toJSON', {
  virtuals: true,
  transform: function (_doc: unknown, ret: IAppointment & { __v?: number }) {
    // Remove internal fields from API responses
    const { __v, ...rest } = ret;
    return rest;
  },
});


export default mongoose.model<IAppointment, IAppointmentModel>(
  'Appointment',
  AppointmentSchema
);
