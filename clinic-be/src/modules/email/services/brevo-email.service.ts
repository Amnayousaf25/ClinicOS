import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class BrevoEmailService {
  private readonly logger = new Logger(BrevoEmailService.name);

  constructor(private readonly configService: ConfigService) {}

  async sendEmail(
    to: string,
    subject: string,
    bodyHtml = '',
    bodyText?: string,
  ) {
    const apiKey = this.configService.get<string>('BREVO_API_KEY');
    if (!apiKey) {
      throw new Error('BREVO_API_KEY is not configured');
    }

    const senderEmail =
      this.configService.get<string>('MAIL_FROM') ||
      this.configService.get<string>('SMTP_FROM') ||
      this.configService.get<string>('EMAIL_FROM') ||
      'amnaayyy25@gmail.com';

    this.logger.log(`Attempting to send email to ${to} via Brevo HTTP API...`);

    const payload: Record<string, any> = {
      sender: {
        email: senderEmail,
        name: 'ClinicOS',
      },
      to: [{ email: to }],
      subject,
    };

    if (bodyHtml) {
      payload.htmlContent = bodyHtml;
    } else if (bodyText) {
      payload.textContent = bodyText;
    }

    try {
      const response = await fetch('https://api.brevo.com/v3/smtp/email', {
        method: 'POST',
        headers: {
          'accept': 'application/json',
          'api-key': apiKey,
          'content-type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorText = await response.text();
        this.logger.error(`Brevo API Error: ${response.status} - ${errorText}`);
        throw new Error(`Failed to send email via Brevo: ${response.statusText}`);
      }

      const result = await response.json();
      this.logger.log(
        `Email successfully sent via Brevo HTTP API to ${to}. MessageId: ${result.messageId || 'none'}`,
      );
      return result;
    } catch (error: any) {
      this.logger.error(`Error sending email via Brevo HTTP API to ${to}:`, error);
      throw error;
    }
  }
}
