import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import {
  ClinicSettings,
  ClinicSettingsSchema,
} from './schemas/clinic-settings.schema';
import { ClinicSettingsController } from './clinic-settings.controller';
import { ClinicSettingsService } from './clinic-settings.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: ClinicSettings.name, schema: ClinicSettingsSchema },
    ]),
  ],
  controllers: [ClinicSettingsController],
  providers: [ClinicSettingsService],
  exports: [ClinicSettingsService],
})
export class ClinicSettingsModule {}
