import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type ProviderDocument = Provider & Document;

@Schema({ timestamps: true })
export class Provider {
  @Prop({
    type: Types.ObjectId,
    ref: 'Organization',
    required: true,
    index: true,
  })
  orgId: Types.ObjectId;

  @Prop({ required: true })
  name: string;

  @Prop({ default: '' })
  title: string;

  @Prop({ type: Types.ObjectId, ref: 'Service', default: null })
  serviceId: Types.ObjectId;

  @Prop({ default: true })
  isActive: boolean;
}

export const ProviderSchema = SchemaFactory.createForClass(Provider);
ProviderSchema.index({ orgId: 1, name: 1 }, { unique: true });
