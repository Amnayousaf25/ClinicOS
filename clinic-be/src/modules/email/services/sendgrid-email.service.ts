import * as sgMail from '@sendgrid/mail';
import { ConfigService } from '@nestjs/config';
import { Injectable, Logger } from '@nestjs/common';

import { CONFIG } from '../constants/config';
import { SendEmailWithHtmlDto } from '../dto/send-email.dto';

@Injectable()
export class SendgridEmailService {
  private readonly logger = new Logger(SendgridEmailService.name);
  constructor(private readonly configService: ConfigService) {
    const sendGridApiKey = this.configService.get<string>(
      CONFIG.EMAIL_CLIENT_API_KEY,
      '',
    );
    if (sendGridApiKey) {
      sgMail.setApiKey(sendGridApiKey);
    } else {
      this.logger.warn('SendGrid API key is not set. SendgridEmailService will not be active.');
    }
  }

  async sendEmail(email: SendEmailWithHtmlDto) {
    const sendGridApiKey = this.configService.get<string>(
      CONFIG.EMAIL_CLIENT_API_KEY,
      '',
    );
    if (!sendGridApiKey) {
      throw new Error('SendGrid API key is not set');
    }
    const msg = {
      to: email.to,
      from: this.configService.get<string>(CONFIG.EMAIL_SENDER, ''), // Replace with your verified sender email
      subject: email.subject,
      html: email.html, // Pass dynamic content to SendGrid
    };

    try {
      await sgMail.send(msg);
      this.logger.log(`Email sent to ${email.to} successfully.`);
    } catch (error) {
      this.logger.error('Error sending email:', error);
      throw new Error('Error sending email');
    }
  }
}
