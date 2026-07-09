import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import {
  Appointment,
  AppointmentSchema,
} from 'src/modules/appointments/schemas/appointment.schema';
import {
  Provider,
  ProviderSchema,
} from 'src/modules/providers/schemas/provider.schema';
import { BookingController } from './booking.controller';
import { BookingService } from './booking.service';
import { ServicesModule } from 'src/modules/services/services.module';
import { ClinicSettingsModule } from 'src/modules/clinic-settings/clinic-settings.module';
import { OrganizationsModule } from 'src/modules/organizations/organizations.module';
import { RemindersModule } from 'src/modules/reminders/reminders.module';
import { PatientsModule } from 'src/modules/patients/patients.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Appointment.name, schema: AppointmentSchema },
      { name: Provider.name, schema: ProviderSchema },
    ]),
    ServicesModule,
    ClinicSettingsModule,
    OrganizationsModule,
    RemindersModule,
    PatientsModule,
  ],
  controllers: [BookingController],
  providers: [BookingService],
  exports: [BookingService],
})
export class BookingModule {}
