import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type AppointmentDocument = Appointment & Document;

export enum AppointmentStatus {
  Confirmed = 'confirmed',
  Pending = 'pending',
  Cancelled = 'cancelled',
  NoShow = 'no-show',
  Arrived = 'arrived',
  Rescheduled = 'rescheduled',
  IntakeSubmitted = 'intake-submitted',
}

export enum IntakeStatus {
  Confirmed = 'confirmed',
  Submitted = 'submitted',
  Pending = 'pending',
  NotSent = 'not-sent',
}

export enum AppointmentType {
  Scheduled = 'scheduled',
  WalkIn = 'walk-in',
}

@Schema({
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
})
export class Appointment {
  @Prop({
    type: Types.ObjectId,
    ref: 'Organization',
    required: true,
    index: true,
  })
  orgId: Types.ObjectId;

  @Prop({
    type: Types.ObjectId,
    ref: 'Patient',
    required: true,
    index: true,
  })
  patientId: Types.ObjectId;

  @Prop({
    type: Types.ObjectId,
    ref: 'Service',
    required: true,
    index: true,
  })
  serviceId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Provider', default: null, index: true })
  providerId: Types.ObjectId | null;

  @Prop({ required: true })
  date: string;

  @Prop({ required: true })
  time: string;

  @Prop({
    type: String,
    enum: AppointmentStatus,
    default: AppointmentStatus.Pending,
  })
  status: AppointmentStatus;

  @Prop({ type: String, enum: IntakeStatus, default: IntakeStatus.NotSent })
  intakeStatus: IntakeStatus;

  @Prop({ default: 0 })
  remindersSent: number;

  @Prop({ default: 3 })
  remindersTotal: number;

  @Prop({
    type: [Object],
    default: [
      { type: 'confirmation', sent: false },
      { type: '24h', sent: false },
      { type: '2h', sent: false },
    ],
  })
  smsReminders: { type: string; sent: boolean }[];

  @Prop({ default: '' })
  notes: string;

  @Prop({ required: true, unique: true, index: true })
  bookingId: string;

  @Prop({ type: Types.ObjectId, ref: 'User', default: null })
  createdBy: Types.ObjectId | null;

  @Prop({
    type: String,
    enum: AppointmentType,
    default: AppointmentType.Scheduled,
    index: true,
  })
  appointmentType: AppointmentType;

  @Prop({ default: 0 })
  rescheduleCount: number;

  @Prop({ type: Date, default: null })
  lastRescheduledAt: Date | null;

  @Prop({ type: Date, default: null })
  cancelledAt: Date | null;

  @Prop({ default: '' })
  cancelReason: string;
}

export const AppointmentSchema = SchemaFactory.createForClass(Appointment);

AppointmentSchema.index({ orgId: 1, date: 1, status: 1 });
AppointmentSchema.index({ orgId: 1, date: 1, time: 1 });
AppointmentSchema.index({ orgId: 1, rescheduleCount: -1 });

/**
 * Auto-populate patient/service/provider refs on every read so the
 * API never sends bare ObjectIds for these fields. Chained one path
 * at a time because `populate(arrayOfOptions)` has been inconsistent
 * across Mongoose versions. Document writes (create/save) don't fire
 * these hooks — refetch via findById to get the same populated shape.
 */
function autoPopulate(this: any) {
  this.populate('patientId');
  this.populate('serviceId', '_id name');
  this.populate('providerId', '_id name title');
}
AppointmentSchema.pre('find', autoPopulate);
AppointmentSchema.pre('findOne', autoPopulate);
