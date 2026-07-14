import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

import { AuthModule } from 'src/modules/auth/auth.module';
import { User, UserSchema } from 'src/modules/user/user.schema';

import { NotificationsService } from './notifications.service';
import { NotificationsController } from './notifications.controller';
import {
  Notification,
  NotificationSchema,
} from './schemas/notification.schema';
import {
  NotificationReadStatus,
  NotificationReadStatusSchema,
} from './schemas/notification-read-status.schema';

@Module({
  imports: [
    AuthModule,
    MongooseModule.forFeature([
      { name: Notification.name, schema: NotificationSchema },
      { name: User.name, schema: UserSchema },
      {
        name: NotificationReadStatus.name,
        schema: NotificationReadStatusSchema,
      },
    ]),
  ],
  providers: [NotificationsService],
  controllers: [NotificationsController],
  exports: [NotificationsService],
})
export class NotificationsModule {}
