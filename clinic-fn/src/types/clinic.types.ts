import type { BlockedSlot } from './appointment.types';

export interface ClinicSettings {
  clinicName: string;
  workingHours: { start: string; end: string };
  workingDays: number[];
  slotDuration: number;
  timeFormat?: '12' | '24';
  blockedSlots?: BlockedSlot[];
  smsTemplates: {
    confirmation: string;
    reminder24h: string;
    reminder2h: string;
  };
  enabledReminders: {
    confirmation: boolean;
    reminder24h: boolean;
    reminder2h: boolean;
  };
}
