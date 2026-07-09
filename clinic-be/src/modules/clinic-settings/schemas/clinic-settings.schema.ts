import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type ClinicSettingsDocument = ClinicSettings & Document;

class DayAvailability {
  enabled: boolean;
  start: string;
  end: string;
}

class BlockedSlot {
  date: string;
  time: string;
}

@Schema({ timestamps: true })
export class ClinicSettings {
  @Prop({
    type: Types.ObjectId,
    ref: 'Organization',
    required: true,
    unique: true,
    index: true,
  })
  orgId: Types.ObjectId;

  @Prop({ default: '' })
  clinicName: string;

  @Prop({ default: '' })
  phone: string;

  @Prop({ default: '' })
  email: string;

  @Prop({ default: '' })
  address: string;

  @Prop({ default: null })
  logoUrl: string;

  @Prop({
    type: Object,
    default: {
      monday: { enabled: true, start: '09:00', end: '17:00' },
      tuesday: { enabled: true, start: '09:00', end: '17:00' },
      wednesday: { enabled: true, start: '09:00', end: '17:00' },
      thursday: { enabled: true, start: '09:00', end: '17:00' },
      friday: { enabled: true, start: '09:00', end: '17:00' },
      saturday: { enabled: false, start: '09:00', end: '13:00' },
      sunday: { enabled: false, start: '09:00', end: '13:00' },
    },
  })
  availability: Record<string, DayAvailability>;

  @Prop({ default: 30 })
  slotDuration: number;

  @Prop({ type: [Number], default: [1, 2, 3, 4, 5] })
  workingDays: number[];

  @Prop({ type: Object, default: { start: '08:00', end: '17:00' } })
  workingHours: { start: string; end: string };

  @Prop({ default: '24' })
  timeFormat: string;

  @Prop({
    type: Object,
    default: {
      confirmation:
        'Hi {name}, your appointment at {clinic} is confirmed for {date} at {time}. Complete your intake form: {link}',
      reminder24h:
        'Reminder: You have an appointment at {clinic} tomorrow at {time}. Reply YES to confirm or NO to cancel.',
      reminder2h:
        'Your appointment at {clinic} is in 2 hours at {time}. See you soon!',
    },
  })
  smsTemplates: {
    confirmation: string;
    reminder24h: string;
    reminder2h: string;
  };

  @Prop({
    type: Object,
    default: { confirmation: true, reminder24h: true, reminder2h: true },
  })
  enabledReminders: {
    confirmation: boolean;
    reminder24h: boolean;
    reminder2h: boolean;
  };

  @Prop({ type: [Object], default: [] })
  blockedSlots: BlockedSlot[];
}

export const ClinicSettingsSchema =
  SchemaFactory.createForClass(ClinicSettings);
