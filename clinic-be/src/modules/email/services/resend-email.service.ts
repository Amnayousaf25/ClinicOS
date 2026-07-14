import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Resend } from 'resend';

@Injectable()
export class ResendEmailService {
  private resend: Resend;
  private readonly logger = new Logger(ResendEmailService.name);
  private readonly from: string;

  constructor(private configService: ConfigService) {
    const apiKey =
      this.configService.get<string>('EMAIL_API_KEY') ||
      this.configService.get<string>('Email_API_KEY');
    this.resend = new Resend(apiKey);
    this.from =
      this.configService.get<string>('EMAIL_FROM') ||
      this.configService.get<string>('MAIL_FROM') ||
      'support@clinicos.com';
  }

  async sendEmail(
    to: string,
    subject: string,
    bodyHtml = '',
    bodyText?: string,
  ) {
    try {
      let targetRecipient = to;
      let targetSubject = subject;

      // Send directly to the target recipient (no redirect in dev mode)

      const payload: Record<string, any> = {
        from: this.from,
        to: targetRecipient,
        subject: targetSubject,
      };
      if (bodyHtml) payload.html = bodyHtml;
      if (bodyText) payload.text = bodyText;

      const response = await this.resend.emails.send(payload as any);

      if (response.error) {
        this.logger.error('Resend API error:', response.error);
        
        const isDomainUnverified =
          response.error.message?.toLowerCase().includes('not verified') ||
          response.error.statusCode === 403 ||
          response.error.name === 'validation_error';
        
        if (isDomainUnverified && this.from !== 'onboarding@resend.dev') {
          this.logger.warn(
            `Retrying email send via Resend onboarding@resend.dev fallback due to unverified domain: ${this.from}`,
          );
          const fallbackPayload = { ...payload, from: 'onboarding@resend.dev' };
          const fallbackResponse = await this.resend.emails.send(
            fallbackPayload as any,
          );
          if (!fallbackResponse.error) {
            this.logger.log(
              `Email successfully sent using onboarding@resend.dev fallback.`,
            );
            return fallbackResponse;
          } else {
            this.logger.error(
              'Resend fallback also failed:',
              fallbackResponse.error,
            );
            throw new Error(
              fallbackResponse.error.message ||
                'Failed to send email via Resend fallback',
            );
          }
        }

        throw new Error(response.error.message || 'Failed to send email via Resend');
      }

      this.logger.log(`Email sent to ${to} successfully.`);
      return response;
    } catch (error: unknown) {
      this.logger.error('Error sending email:', error);
      throw error;
    }
  }
}
