import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { OrgPlan } from '../types/organization.types';

export type OrganizationDocument = Organization & Document;

@Schema({ timestamps: true })
export class Organization {
  @Prop({ required: true })
  name: string;

  @Prop({ required: true, unique: true, lowercase: true, trim: true })
  slug: string;

  @Prop({ type: String, enum: OrgPlan, default: OrgPlan.Trial })
  plan: OrgPlan;

  @Prop({ default: 50 })
  maxUsers: number;

  @Prop({ type: Types.ObjectId, ref: 'User', default: null, index: true })
  ownerId: Types.ObjectId | null;

  @Prop({ default: true })
  isActive: boolean;

  @Prop({ type: Object, default: {} })
  roleDefaultOverrides: Record<string, Record<string, boolean>>;
}

export const OrganizationSchema = SchemaFactory.createForClass(Organization);
OrganizationSchema.index({ slug: 1 }, { unique: true });
OrganizationSchema.index({ isActive: 1 });
