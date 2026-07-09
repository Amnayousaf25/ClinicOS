import {
  SendEmailCommand,
  SendEmailCommandInput,
  SESClient,
  SESClientConfig,
} from '@aws-sdk/client-ses';

import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { CONFIG } from '../constants/config';

@Injectable()
export class SESMailService {
  private sesClient: SESClient;
  private readonly configService: ConfigService;
  private readonly logger = new Logger(SESMailService.name);

  constructor(configService: ConfigService) {
    this.configService = configService;
    const sesConfig: SESClientConfig = {
      region: this.configService.get<string>(CONFIG.AWS_REGION) ?? '',
      credentials: {
        accessKeyId:
          this.configService.get<string>(CONFIG.AWS_ACCESS_KEY_ID) ?? '',
        secretAccessKey:
          this.configService.get<string>(CONFIG.AWS_SECRET_ACCESS_KEY) ?? '',
      },
    };

    this.sesClient = new SESClient(sesConfig);
  }

  async sendEmail(
    to: string,
    subject: string,
    bodyHtml = '',
    bodyText?: string,
  ) {
    try {
      const input: SendEmailCommandInput = {
        Source: 'hello@bts1c.com',

        Destination: { ToAddresses: [to] },
        Message: {
          Subject: { Data: subject },
          Body: {
            Text: { Data: bodyText },
            ...(bodyHtml && {
              Html: { Data: bodyHtml },
            }),
          },
        },
      };

      const command = new SendEmailCommand(input);

      const response = await this.sesClient.send(command);
      this.logger.log(`Email sent to ${to} successfully.`);

      return response;
    } catch (error: unknown) {
      this.logger.error('Error sending email:', error);
    }
  }
}
