import { Module } from '@nestjs/common';
import { OneSignalService } from './onesignal.service';

@Module({
  providers: [OneSignalService],
  exports: [OneSignalService],
})
export class OneSignalModule {}
