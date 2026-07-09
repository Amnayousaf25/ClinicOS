import { SchemaFactory, Prop, Schema } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ timestamps: true })
export class File {
  @Prop({ required: true })
  path: string;
}

export const FileSchema = SchemaFactory.createForClass(File);

export type FileDocument = File & Document;
