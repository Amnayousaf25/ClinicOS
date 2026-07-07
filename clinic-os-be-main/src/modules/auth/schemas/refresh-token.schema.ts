import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

@Schema({ timestamps: true })
export class RefreshToken {
  @Prop({ required: true, type: Types.ObjectId, ref: 'User' })
  userId: Types.ObjectId;

  @Prop({ required: true, type: String })
  token: string;

  @Prop({ required: true, type: Date })
  expiresAt: Date;

  @Prop({ required: true, default: false, type: Boolean })
  isRevoked: boolean;

  @Prop({ type: String })
  deviceInfo: string;

  @Prop({ type: String })
  ipAddress: string;
}

export const RefreshTokenSchema = SchemaFactory.createForClass(RefreshToken);

export type RefreshTokenDocument = RefreshToken & Document;

// Create index for automatic cleanup of expired tokens
RefreshTokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
RefreshTokenSchema.index({ userId: 1 });
RefreshTokenSchema.index({ token: 1 });
