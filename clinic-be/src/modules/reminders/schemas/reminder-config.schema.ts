import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type ReminderConfigDocument = ReminderConfig & Document;

export enum ReminderType {
  BookingConfirmation = 'booking_confirmation',
  TwentyFourHour = '24_hour',
  TwoHour = '2_hour',
}

@Schema({ timestamps: true })
export class ReminderConfig {
  @Prop({
    type: Types.ObjectId,
    ref: 'Organization',
    required: true,
    index: true,
  })
  orgId: Types.ObjectId;

  @Prop({ type: String, enum: ReminderType, required: true })
  type: ReminderType;

  @Prop({ required: true })
  label: string;

  @Prop({ default: true })
  enabled: boolean;

  @Prop({ required: true })
  message: string;
}

export const ReminderConfigSchema =
  SchemaFactory.createForClass(ReminderConfig);
ReminderConfigSchema.index({ orgId: 1, type: 1 }, { unique: true });
