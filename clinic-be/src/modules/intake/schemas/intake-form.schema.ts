import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type IntakeFormDocument = IntakeForm & Document;

@Schema({ timestamps: true })
export class IntakeForm {
  @Prop({
    type: Types.ObjectId,
    ref: 'Organization',
    required: true,
    index: true,
  })
  orgId: Types.ObjectId;

  @Prop({
    type: Types.ObjectId,
    ref: 'Appointment',
    required: true,
    unique: true,
    index: true,
  })
  appointmentId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Patient', default: null, index: true })
  patientId: Types.ObjectId | null;

  @Prop({ required: true })
  name: string;

  @Prop({ required: true })
  dob: string;

  @Prop({ default: '' })
  insuranceProvider: string;

  @Prop({ default: '' })
  insuranceNumber: string;

  @Prop({ required: true })
  phone: string;

  @Prop({ required: true })
  email: string;

  @Prop({ default: '' })
  address: string;

  @Prop({ default: '' })
  allergies: string;

  @Prop({ default: '' })
  medications: string;

  @Prop({ default: '' })
  emergencyContact: string;

  @Prop({ default: '' })
  emergencyPhone: string;

  @Prop({ required: true })
  reasonForVisit: string;

  @Prop({ required: true })
  consent: boolean;

  @Prop({ required: true })
  submittedAt: Date;

  @Prop({ type: String, default: null })
  ipAddress: string | null;
}

export const IntakeFormSchema = SchemaFactory.createForClass(IntakeForm);
