import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as OneSignal from '@onesignal/node-onesignal';

import { CONFIG } from './constants/config';

@Injectable()
export class OneSignalService {
  private client: OneSignal.DefaultApi;
  private logger = new Logger(OneSignalService.name);

  constructor(private readonly configService: ConfigService) {
    const configuration = OneSignal.createConfiguration({
      restApiKey: this.configService.get<string>(CONFIG.ONESIGNAL_API_KEY)!,
    });
    this.client = new OneSignal.DefaultApi(configuration);
  }

  async sendNotification(
    heading: string,
    content: string,
    externalUserIds: string[], // User IDs for targeting
    data?: Record<string, any>,
  ) {
    if (!externalUserIds || externalUserIds.length === 0) {
      throw new Error('At least one external user ID is required');
    }

    const notification: OneSignal.Notification = {
      app_id: this.configService.get<string>(CONFIG.ONESIGNAL_APP_ID)!,
      headings: { en: heading },
      contents: { en: content },
      include_subscription_ids: externalUserIds,
      data: data || {},
    };

    try {
      const response = await this.client.createNotification(notification);
      this.logger.log(`Notification sent: ${JSON.stringify(response)}`);
      return response;
    } catch (error) {
      this.logger.error('Error sending notification', error);
      throw error;
    }
  }
}
