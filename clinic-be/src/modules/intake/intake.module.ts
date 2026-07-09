import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { IntakeForm, IntakeFormSchema } from './schemas/intake-form.schema';
import {
  Appointment,
  AppointmentSchema,
} from 'src/modules/appointments/schemas/appointment.schema';
import {
  AppointmentHistory,
  AppointmentHistorySchema,
} from 'src/modules/appointments/schemas/appointment-history.schema';
import { IntakeController } from './intake.controller';
import { IntakeService } from './intake.service';
import { ClinicSettingsModule } from 'src/modules/clinic-settings/clinic-settings.module';
import { ServicesModule } from 'src/modules/services/services.module';
import { ProvidersModule } from 'src/modules/providers/providers.module';
import { PatientsModule } from 'src/modules/patients/patients.module';
import { AuthModule } from 'src/modules/auth/auth.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: IntakeForm.name, schema: IntakeFormSchema },
      { name: Appointment.name, schema: AppointmentSchema },
      { name: AppointmentHistory.name, schema: AppointmentHistorySchema },
    ]),
    ClinicSettingsModule,
    ServicesModule,
    ProvidersModule,
    PatientsModule,
    AuthModule,
  ],
  controllers: [IntakeController],
  providers: [IntakeService],
  exports: [IntakeService],
})
export class IntakeModule {}
