import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type PatientDocument = Patient & Document;

@Schema({ _id: false })
export class PhoneHistoryEntry {
  @Prop({ type: String, required: true })
  phone: string;

  @Prop({ type: Date, required: true })
  changedAt: Date;
}

const PhoneHistoryEntrySchema = SchemaFactory.createForClass(PhoneHistoryEntry);

@Schema({ timestamps: true })
export class Patient {
  @Prop({
    type: Types.ObjectId,
    ref: 'Organization',
    required: true,
    index: true,
  })
  orgId: Types.ObjectId;

  // Medical Record Number — immutable, human-facing patient identifier.
  // Generated once on registration, scoped per org.
  @Prop({ type: String, required: true, index: true })
  mrn: string;

  @Prop({ type: String, required: true })
  name: string;

  // Current contact phone — searchable but intentionally NOT indexed
  // because it changes; relying on it as a key produces duplicates.
  @Prop({ type: String, default: '' })
  phone: string;

  @Prop({ type: [PhoneHistoryEntrySchema], default: [] })
  phoneHistory: PhoneHistoryEntry[];

  @Prop({ type: String, default: '' })
  email: string;

  @Prop({ type: String, default: '' })
  dob: string;

  @Prop({ type: String, default: '' })
  address: string;

  @Prop({ type: String, default: '' })
  insuranceProvider: string;

  @Prop({ type: String, default: '' })
  insuranceNumber: string;

  @Prop({ type: String, default: '' })
  allergies: string;

  @Prop({ type: String, default: '' })
  medications: string;

  @Prop({ type: String, default: '' })
  emergencyContact: string;

  @Prop({ type: String, default: '' })
  emergencyPhone: string;

  @Prop({ type: Date, default: null })
  lastVisitAt: Date | null;
}

export const PatientSchema = SchemaFactory.createForClass(Patient);

// MRN is the only stable identifier — unique within an organization.
PatientSchema.index({ orgId: 1, mrn: 1 }, { unique: true });
PatientSchema.index({ orgId: 1, name: 1 });
PatientSchema.index({ orgId: 1, email: 1 });
