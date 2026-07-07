import { Document } from 'mongoose';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';

import { OTP_TYPE } from '../types/otp.type';

@Schema({ timestamps: true })
export class Otp {
  @Prop({ required: true })
  email: string;

  @Prop({ required: true })
  otp: string;

  @Prop({ required: true, enum: Object.values(OTP_TYPE) })
  accessType: OTP_TYPE;

  @Prop({ required: true, default: false })
  isVerified: boolean;

  @Prop({ type: String })
  secret: string; // TOTP secret (if using TOTP)

  @Prop({ type: Date })
  expiresAt: Date; // OTP expiration timestamp

  @Prop({ type: Number, default: 0 })
  attempts: number; // Number of verification attempts

  @Prop({ type: Date })
  lastAttemptAt: Date; // Last verification attempt timestamp
}

export const OtpSchema = SchemaFactory.createForClass(Otp);

export type OtpDocument = Otp & Document;

// Add TTL index for automatic expiry
OtpSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
