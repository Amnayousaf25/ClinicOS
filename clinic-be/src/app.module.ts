/**
 * Root application module for ClinicOS.
 *
 * AppModule is the composition root. It wires together:
 *  - Global configuration (ConfigModule) backed by per-environment `.env` files
 *  - MongoDB persistence layer (MongooseModule)
 *  - All feature modules
 */
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { ScheduleModule } from '@nestjs/schedule';
import { AuthModule } from 'src/modules/auth/auth.module';
import { UsersModule } from 'src/modules/users/users.module';
import { DepartmentsModule } from 'src/modules/departments/departments.module';
import { OrganizationsModule } from 'src/modules/organizations/organizations.module';
import { ChatModule } from 'src/modules/chat/chat.module';
import { MediaModule } from 'src/modules/media/media.module';
import { NotificationsModule } from 'src/modules/notifications/notifications.module';
import { OneSignalModule } from 'src/modules/onesignal/onesignal.module';
import { EmailModule } from 'src/modules/email/email.module';
import { ClinicSettingsModule } from 'src/modules/clinic-settings/clinic-settings.module';
import { ServicesModule } from 'src/modules/services/services.module';
import { AppointmentsModule } from 'src/modules/appointments/appointments.module';
import { BookingModule } from 'src/modules/booking/booking.module';
import { SmsModule } from 'src/modules/sms/sms.module';
import { RemindersModule } from 'src/modules/reminders/reminders.module';
import { IntakeModule } from 'src/modules/intake/intake.module';
import { ProvidersModule } from 'src/modules/providers/providers.module';
import { InsuranceModule } from 'src/modules/insurance/insurance.module';
import { PatientsModule } from 'src/modules/patients/patients.module';
import { S3Module } from 'src/common/services/s3.module';
import { CONFIG } from 'src/common/constants/config.constants';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      cache: true,
      envFilePath: `.env.${process.env.NODE_ENV || 'dev'}`,
      ignoreEnvFile:
        process.env.NODE_ENV === 'production' ||
        process.env.NODE_ENV === 'prod' ||
        process.env.NODE_ENV === 'staging',
    }),

    MongooseModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (c: ConfigService) => ({
        uri: c.get<string>(CONFIG.MONGODB_URI),
      }),
    }),

    ScheduleModule.forRoot(),

    S3Module,
    AuthModule,
    UsersModule,
    DepartmentsModule,
    OrganizationsModule,
    ChatModule,
    MediaModule,
    NotificationsModule,
    OneSignalModule,
    EmailModule,
    ClinicSettingsModule,
    ServicesModule,
    ProvidersModule,
    InsuranceModule,
    PatientsModule,
    AppointmentsModule,
    BookingModule,
    SmsModule,
    RemindersModule,
    IntakeModule,
  ],
})
export class AppModule {}
