import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { UserRole, InvitationStatus } from '../types/user.types';

export type UserDocument = User & Document;

@Schema({ timestamps: true })
export class User {
  @Prop({
    type: Types.ObjectId,
    ref: 'Organization',
    default: null,
    index: true,
  })
  orgId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, default: null })
  externalId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User', default: null, index: true })
  createdBy: Types.ObjectId | null;

  @Prop({ required: true })
  name: string;

  @Prop({ required: true, lowercase: true, trim: true })
  email: string;

  @Prop({ required: true })
  employeeId: string;

  @Prop({ required: true })
  password: string;

  @Prop({ type: String, enum: UserRole, required: true })
  role: UserRole;

  @Prop({ type: Types.ObjectId, ref: 'Department' })
  department: Types.ObjectId;

  @Prop({ default: true })
  isActive: boolean;

  @Prop({ default: null })
  deletedAt: Date;

  @Prop({ default: null })
  invitationToken: string;

  @Prop({
    type: String,
    enum: InvitationStatus,
    default: InvitationStatus.Pending,
  })
  invitationStatus: InvitationStatus;

  @Prop({
    type: Object,
    default: {},
  })
  permissionOverrides: Record<string, boolean>;

  @Prop({ type: Number, default: 1 })
  permissionsVersion: number;

  @Prop({ type: String, default: null })
  profileImage: string;
}

export const UserSchema = SchemaFactory.createForClass(User);
UserSchema.index(
  { orgId: 1, email: 1 },
  {
    unique: true,
    partialFilterExpression: { deletedAt: null },
  },
);
UserSchema.index(
  { orgId: 1, employeeId: 1 },
  {
    unique: true,
    partialFilterExpression: { deletedAt: null },
  },
);
UserSchema.index({ orgId: 1, department: 1 });
UserSchema.index({ orgId: 1, role: 1 });
UserSchema.index({ deletedAt: 1 });
