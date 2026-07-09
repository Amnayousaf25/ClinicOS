import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type InsuranceProviderDocument = InsuranceProvider & Document;

@Schema({ timestamps: true })
export class InsuranceProvider {
  @Prop({
    type: Types.ObjectId,
    ref: 'Organization',
    required: true,
    index: true,
  })
  orgId: Types.ObjectId;

  @Prop({ required: true })
  name: string;

  @Prop({ default: true })
  isActive: boolean;
}

export const InsuranceProviderSchema =
  SchemaFactory.createForClass(InsuranceProvider);
InsuranceProviderSchema.index({ orgId: 1, name: 1 }, { unique: true });
