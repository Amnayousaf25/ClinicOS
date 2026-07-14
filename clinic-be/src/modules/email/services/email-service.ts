import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';
import * as Handlebars from 'handlebars';
import { ConfigService } from '@nestjs/config';
import { SmtpEmailService } from './smtp-email.service';
import { ResendEmailService } from './resend-email.service';
import { BrevoEmailService } from './brevo-email.service';

@Injectable()
export class EmailService implements OnModuleInit {
  private readonly logger = new Logger(EmailService.name);

  constructor(
    private readonly configService: ConfigService,
    private readonly smtpEmailService: SmtpEmailService,
    private readonly resendEmailService: ResendEmailService,
    private readonly brevoEmailService: BrevoEmailService,
  ) {}

  onModuleInit() {
    const nodeEnv = this.configService.get<string>('NODE_ENV') || 'dev';
    this.logger.log(`[EmailService] Initializing in environment: ${nodeEnv}`);

    const smtpUser =
      this.configService.get<string>('MAIL_USER') ||
      this.configService.get<string>('SMTP_USER');
    const resendApiKey =
      this.configService.get<string>('EMAIL_API_KEY') ||
      this.configService.get<string>('Email_API_KEY');
    const brevoApiKey = this.configService.get<string>('BREVO_API_KEY');

    this.logger.log(
      `[EmailService Diagnostic] SMTP User present: ${!!smtpUser}, Resend API Key present: ${!!resendApiKey}, Brevo API Key present: ${!!brevoApiKey}`,
    );
  }

  loadTemplate(templateName: string, context: Record<string, any>) {
    const filePath = path.resolve(`src/email-templates/${templateName}.hbs`);
    const templateSource = fs.readFileSync(filePath, 'utf-8');
    const template = Handlebars.compile(templateSource);
    return template(context);
  }

  async sendEmail(
    to: string,
    subject: string,
    bodyHtml = '',
    bodyText?: string,
  ) {
    const nodeEnv = this.configService.get<string>('NODE_ENV') || 'dev';
    const isProduction = nodeEnv === 'production' || nodeEnv === 'prod';

    if (isProduction) {
      const brevoApiKey = this.configService.get<string>('BREVO_API_KEY');
      const resendApiKey =
        this.configService.get<string>('EMAIL_API_KEY') ||
        this.configService.get<string>('Email_API_KEY');

      this.logger.log(`[EmailService] Production mode. Starting email delivery fallback chain to: ${to}`);

      // 1. Try Brevo HTTP API first if key is present
      if (brevoApiKey) {
        try {
          this.logger.log(`[EmailService] Attempting delivery via Brevo HTTP API...`);
          const result = await this.brevoEmailService.sendEmail(to, subject, bodyHtml, bodyText);
          return result;
        } catch (error: any) {
          this.logger.warn(`[EmailService] Brevo HTTP API failed: ${error.message || error}. Proceeding to fallback...`);
        }
      }

      // 2. Try Resend API if key is present
      if (resendApiKey) {
        try {
          this.logger.log(`[EmailService] Attempting delivery via Resend API...`);
          const result = await this.resendEmailService.sendEmail(to, subject, bodyHtml, bodyText);
          return result;
        } catch (error: any) {
          this.logger.warn(`[EmailService] Resend API failed: ${error.message || error}. Proceeding to fallback...`);
        }
      }

      // 3. Fallback to SmtpEmailService
      try {
        this.logger.log(`[EmailService] Attempting delivery via SmtpEmailService...`);
        const result = await this.smtpEmailService.sendEmail(to, subject, bodyHtml, bodyText);
        return result;
      } catch (error: any) {
        this.logger.error(`[EmailService] SMTP delivery fallback failed: ${error.message || error}`);
        throw error;
      }
    } else {
      this.logger.log(`[EmailService] Development mode. Routing via SMTP to: ${to}`);
      const user =
        this.configService.get<string>('MAIL_USER') ||
        this.configService.get<string>('SMTP_USER');
      const pass =
        this.configService.get<string>('MAIL_PASSWORD') ||
        this.configService.get<string>('SMTP_PASS');

      const isPlaceholder =
        !user ||
        user === 'your_email@gmail.com' ||
        !pass ||
        pass === 'your_app_password';

      if (isPlaceholder) {
        this.logger.warn(
          `[EMAIL NOT SENT] Placeholder SMTP credentials detected (MAIL_USER=${user}). Bypassing email send locally!`,
        );
        return { success: true, dryRun: true };
      }

      try {
        const result = await this.smtpEmailService.sendEmail(to, subject, bodyHtml, bodyText);
        return result;
      } catch (error: any) {
        this.logger.error(`[EmailService] SMTP error sending email to ${to}:`, error);
        throw error;
      }
    }
  }
}
