import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type CounterDocument = Counter & Document;

@Schema({ timestamps: true })
export class Counter {
  @Prop({ type: Types.ObjectId, required: true, index: true })
  orgId: Types.ObjectId;

  @Prop({ type: String, required: true })
  scope: string;

  @Prop({ type: Number, required: true, default: 0 })
  seq: number;
}

export const CounterSchema = SchemaFactory.createForClass(Counter);
CounterSchema.index({ orgId: 1, scope: 1 }, { unique: true });
