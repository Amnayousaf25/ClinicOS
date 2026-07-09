import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Resend } from 'resend';

@Injectable()
export class ResendEmailService {
  private resend: Resend;
  private readonly logger = new Logger(ResendEmailService.name);
  private readonly from: string;

  constructor(private configService: ConfigService) {
    const apiKey = this.configService.get<string>('Email_API_KEY');
    this.resend = new Resend(apiKey);
    this.from =
      this.configService.get<string>('EMAIL_FROM') || 'support@hourlli.com';
  }

  async sendEmail(
    to: string,
    subject: string,
    bodyHtml = '',
    bodyText?: string,
  ) {
    try {
      const payload: Record<string, any> = { from: this.from, to, subject };
      if (bodyHtml) payload.html = bodyHtml;
      if (bodyText) payload.text = bodyText;

      const response = await this.resend.emails.send(payload as any);

      this.logger.log(`Email sent to ${to} successfully.`);
      return response;
    } catch (error: unknown) {
      this.logger.error('Error sending email:', error);
      throw error;
    }
  }
}
