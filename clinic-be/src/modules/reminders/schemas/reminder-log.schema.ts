import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type ReminderLogDocument = ReminderLog & Document;

export enum ReminderLogStatus {
  Delivered = 'delivered',
  Pending = 'pending',
  Scheduled = 'scheduled',
  Cancelled = 'cancelled',
  Failed = 'failed',
}

@Schema({ timestamps: true })
export class ReminderLog {
  @Prop({
    type: Types.ObjectId,
    ref: 'Organization',
    required: true,
    index: true,
  })
  orgId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Appointment', required: true })
  appointmentId: Types.ObjectId;

  @Prop({ required: true })
  patientName: string;

  @Prop({ required: true })
  phone: string;

  @Prop({ required: true })
  messageType: string;

  @Prop({ required: true })
  sentAt: Date;

  @Prop({
    type: String,
    enum: ReminderLogStatus,
    default: ReminderLogStatus.Pending,
  })
  status: ReminderLogStatus;

  @Prop({ default: null })
  messageId: string;

  @Prop({ default: '' })
  messageBody: string;

  @Prop({ default: null })
  errorMessage: string;

  /** Telnyx message ID for scheduled messages — used for cancellation */
  @Prop({ default: null })
  scheduledMessageId: string;

  @Prop({ default: null })
  scheduledFor: Date;

  @Prop({ type: String, default: null })
  reply: string | null;
}

export const ReminderLogSchema = SchemaFactory.createForClass(ReminderLog);
ReminderLogSchema.index(
  { orgId: 1, appointmentId: 1, messageType: 1 },
  { unique: true },
);
