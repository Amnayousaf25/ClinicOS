import { Model, Types } from 'mongoose';
import { Subject, Observable } from 'rxjs';
import { InjectModel } from '@nestjs/mongoose';
import { Injectable, OnModuleDestroy, HttpStatus } from '@nestjs/common';

import { SerializeHttpResponse, type Serialized } from 'src/utils/serializer';

import {
  Notification,
  NotificationDocument,
} from './schemas/notification.schema';
import {
  NotificationReadStatus,
  NotificationReadStatusDocument,
} from './schemas/notification-read-status.schema';
import {
  NOTIFICATION_ERRORS,
  NOTIFICATION_SUCCESS,
} from './constants/notification.response';

@Injectable()
export class NotificationsService implements OnModuleDestroy {
  // Map of userId -> Subject
  private clients = new Map<string, Subject<MessageEvent>>();

  constructor(
    @InjectModel(Notification.name)
    private notificationModel: Model<NotificationDocument>,
    @InjectModel(NotificationReadStatus.name)
    private notificationReadStatusModel: Model<NotificationReadStatusDocument>,
  ) {}

  subscribe(userId: string): Observable<MessageEvent> {
    if (!this.clients.has(userId)) {
      this.clients.set(userId, new Subject<MessageEvent>());
    }

    const subject = this.clients.get(userId)!;

    // Clean up if user disconnects
    return new Observable<MessageEvent>((observer) => {
      const subscription = subject.subscribe(observer);

      return () => {
        subscription.unsubscribe();
        this.clients.delete(userId);
      };
    });
  }

  async sendToUser(
    userId: string,
    data: {
      type: string;
      title?: string;
      message: string;
      data?: Record<string, unknown>;
    },
  ) {
    try {
      const notification = new this.notificationModel({
        userId: new Types.ObjectId(userId),
        type: data.type,
        title: data.title || this.getDefaultTitle(data.type),
        message: data.message,
        data: data.data || {},
      });

      const savedNotification = await notification.save();

      const notificationIdForReadStatus =
        savedNotification._id instanceof Types.ObjectId
          ? savedNotification._id
          : new Types.ObjectId(String(savedNotification._id));

      const existingReadStatus = await this.notificationReadStatusModel.findOne(
        {
          userId: new Types.ObjectId(userId),
          notificationId: notificationIdForReadStatus,
        },
      );

      if (!existingReadStatus) {
        const readStatus = new this.notificationReadStatusModel({
          userId: new Types.ObjectId(userId),
          notificationId: notificationIdForReadStatus,
          isRead: false,
          readAt: null,
        });

        await readStatus.save();
      }

      const subject = this.clients.get(userId);
      if (subject) {
        const notificationIdString =
          savedNotification._id instanceof Types.ObjectId
            ? savedNotification._id.toString()
            : String(savedNotification._id);
        subject.next({
          data: {
            ...data,
            notificationId: notificationIdString,
            createdAt: savedNotification.createdAt,
          },
        } as MessageEvent);
      }

      return savedNotification;
    } catch (error) {
      console.error('Error sending notification:', error);
      const subject = this.clients.get(userId);
      if (subject) {
        subject.next({ data } as MessageEvent);
      }
    }
  }

  broadcast(data: MessageEvent['data']) {
    for (const subject of this.clients.values()) {
      subject.next({ data } as MessageEvent);
    }
  }

  async markAsRead(userId: string, notificationId: string) {
    try {
      const readStatus =
        await this.notificationReadStatusModel.findOneAndUpdate(
          {
            userId: new Types.ObjectId(userId),
            notificationId: new Types.ObjectId(notificationId),
          },
          {
            isRead: true,
            readAt: new Date(),
          },
          { new: true, upsert: true },
        );

      return readStatus;
    } catch (error) {
      console.error('Error marking notification as read:', error);
      return null;
    }
  }

  async markAllAsRead(userId: string) {
    try {
      const result = await this.notificationReadStatusModel.updateMany(
        {
          userId: new Types.ObjectId(userId),
          isRead: false,
        },
        {
          isRead: true,
          readAt: new Date(),
        },
      );

      return SerializeHttpResponse(
        {
          modifiedCount: result.modifiedCount,
          matchedCount: result.matchedCount,
        },
        HttpStatus.OK,
        NOTIFICATION_SUCCESS.ALL_NOTIFICATIONS_MARKED_AS_READ,
      );
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      return SerializeHttpResponse(
        null,
        HttpStatus.INTERNAL_SERVER_ERROR,
        NOTIFICATION_ERRORS.MARK_AS_READ_FAILED,
      );
    }
  }

  async getUserNotifications(
    userId: string,
    page: number = 1,
    limit: number = 10,
  ): Promise<Serialized<unknown, number>> {
    try {
      const skip = (page - 1) * limit;

      const notifications = await this.notificationModel
        .find({
          userId: new Types.ObjectId(userId),
          isDeleted: false,
        })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean();

      const notificationIds = notifications.map((n) => {
        return n._id instanceof Types.ObjectId
          ? n._id
          : new Types.ObjectId(n._id as string);
      });

      const readStatuses = await this.notificationReadStatusModel
        .find({
          userId: new Types.ObjectId(userId),
          notificationId: { $in: notificationIds },
        })
        .lean();

      const readStatusMap = new Map(
        readStatuses.map((rs) => {
          const notificationIdString =
            rs.notificationId instanceof Types.ObjectId
              ? rs.notificationId.toString()
              : String(rs.notificationId);
          return [
            notificationIdString,
            {
              isRead: rs.isRead,
              readAt: rs.readAt,
            },
          ];
        }),
      );

      const notificationsWithReadStatus = notifications.map((notification) => {
        const notificationIdString =
          notification._id instanceof Types.ObjectId
            ? notification._id.toString()
            : (notification._id as string);
        const readStatus = readStatusMap.get(notificationIdString);
        return {
          ...notification,
          isRead: readStatus?.isRead || false,
          readAt: readStatus?.readAt || null,
        };
      });

      const totalCount = await this.notificationModel.countDocuments({
        userId: new Types.ObjectId(userId),
        isDeleted: false,
      });

      const totalPages = Math.ceil(totalCount / limit);
      const hasNextPage = page < totalPages;
      const hasPrevPage = page > 1;

      return SerializeHttpResponse(
        {
          notifications: notificationsWithReadStatus,
          pagination: {
            currentPage: page,
            totalPages,
            totalItems: totalCount,
            itemsPerPage: limit,
            hasNextPage,
            hasPrevPage,
          },
        },
        HttpStatus.OK,
        NOTIFICATION_SUCCESS.NOTIFICATIONS_RETRIEVED,
      );
    } catch (error) {
      console.error('Error getting user notifications:', error);
      return SerializeHttpResponse(
        null,
        HttpStatus.INTERNAL_SERVER_ERROR,
        NOTIFICATION_ERRORS.NOTIFICATIONS_RETRIEVE_FAILED,
      );
    }
  }

  async getUnreadCount(userId: string) {
    try {
      const count = await this.notificationReadStatusModel.countDocuments({
        userId: new Types.ObjectId(userId),
        isRead: false,
      });

      return SerializeHttpResponse(
        {
          userId,
          unreadCount: count,
        },
        HttpStatus.OK,
        NOTIFICATION_SUCCESS.UNREAD_COUNT_RETRIEVED,
      );
    } catch (error) {
      console.error('Error getting unread count:', error);
      return SerializeHttpResponse(
        null,
        HttpStatus.INTERNAL_SERVER_ERROR,
        NOTIFICATION_ERRORS.UNREAD_COUNT_FAILED,
      );
    }
  }

  private getDefaultTitle(type: string): string {
    const titleMap: Record<string, string> = {
      booking_cancelled: 'Booking Cancelled',
      booking_confirmed: 'Booking Confirmed',
      booking_reminder: 'Booking Reminder',
    };

    return titleMap[type] || 'Notification';
  }

  onModuleDestroy() {
    for (const subject of this.clients.values()) {
      subject.complete();
    }
    this.clients.clear();
  }
}
