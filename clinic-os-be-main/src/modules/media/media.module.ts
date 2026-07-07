import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

// Dependency modules
import { User, UserSchema } from 'src/modules/user/user.schema';
import { File, FileSchema } from 'src/modules/media/schemas/file.schema';

// Local files
import { MediaService } from './media.service';
import { MediaController } from './media.controller';

const MODELS = [
  { name: File.name, schema: FileSchema },
  { name: User.name, schema: UserSchema },
];

@Module({
  imports: [MongooseModule.forFeature(MODELS)],
  controllers: [MediaController],
  providers: [MediaService],
  exports: [MediaService],
})
export class MediaModule {}
