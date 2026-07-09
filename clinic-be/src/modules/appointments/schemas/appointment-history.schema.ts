import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { AppointmentStatus } from './appointment.schema';

export type AppointmentHistoryDocument = AppointmentHistory & Document;

export enum AppointmentHistoryAction {
  Created = 'created',
  Rescheduled = 'rescheduled',
  Cancelled = 'cancelled',
  StatusChanged = 'status_changed',
}

export enum AppointmentHistoryActor {
  Staff = 'staff',
  Patient = 'patient',
  System = 'system',
}

@Schema({ timestamps: { createdAt: 'changedAt', updatedAt: false } })
export class AppointmentHistory {
  @Prop({
    type: Types.ObjectId,
    ref: 'Appointment',
    required: true,
    index: true,
  })
  appointmentId: Types.ObjectId;

  @Prop({
    type: Types.ObjectId,
    ref: 'Organization',
    required: true,
    index: true,
  })
  orgId: Types.ObjectId;

  @Prop({ type: String, required: true, index: true })
  patientPhone: string;

  @Prop({ type: String, enum: AppointmentHistoryAction, required: true })
  action: AppointmentHistoryAction;

  @Prop({ type: String, default: null })
  fromDate: string | null;

  @Prop({ type: String, default: null })
  fromTime: string | null;

  @Prop({ type: String, default: null })
  toDate: string | null;

  @Prop({ type: String, default: null })
  toTime: string | null;

  @Prop({ type: String, enum: AppointmentStatus, default: null })
  fromStatus: AppointmentStatus | null;

  @Prop({ type: String, enum: AppointmentStatus, default: null })
  toStatus: AppointmentStatus | null;

  @Prop({ type: String, default: '' })
  reason: string;

  @Prop({ type: String, enum: AppointmentHistoryActor, required: true })
  actor: AppointmentHistoryActor;

  @Prop({ type: Types.ObjectId, ref: 'User', default: null })
  changedBy: Types.ObjectId | null;
}

export const AppointmentHistorySchema =
  SchemaFactory.createForClass(AppointmentHistory);

AppointmentHistorySchema.index({ orgId: 1, action: 1, changedAt: -1 });
AppointmentHistorySchema.index({ patientPhone: 1, action: 1 });
