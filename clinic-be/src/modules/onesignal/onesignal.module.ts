import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { OneSignalService } from './onesignal.service';

@Module({
  providers: [OneSignalService, ConfigService],
  exports: [OneSignalService],
})
export class OneSignalModule {}
