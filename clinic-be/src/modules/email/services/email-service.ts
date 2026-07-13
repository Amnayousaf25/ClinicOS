import { Injectable, Logger } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';
import * as Handlebars from 'handlebars';
import { ConfigService } from '@nestjs/config';
import { ResendEmailService } from './resend-email.service';
import { SmtpEmailService } from './smtp-email.service';
import { SendgridEmailService } from './sendgrid-email.service';
import { SESMailService } from './ses-email.service';

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);

  constructor(
    private readonly configService: ConfigService,
    private readonly resendEmailService: ResendEmailService,
    private readonly smtpEmailService: SmtpEmailService,
    private readonly sendgridEmailService: SendgridEmailService,
    private readonly sesMailService: SESMailService,
  ) {}

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
    const host = this.configService.get<string>('MAIL_HOST');
    const user = this.configService.get<string>('MAIL_USER');
    const pass = this.configService.get<string>('MAIL_PASSWORD');

    const isPlaceholder =
      !user ||
      user === 'your_email@gmail.com' ||
      !pass ||
      pass === 'your_app_password';

    if (isPlaceholder) {
      this.logger.warn(
        `[EMAIL NOT SENT] Placeholder SMTP credentials detected (MAIL_USER=${user}). Please configure actual credentials in .env.dev to receive actual emails!`,
      );
      const isDev = this.configService.get<string>('NODE_ENV') === 'dev';
      if (isDev) {
        return { success: true, dryRun: true };
      }
      throw new Error('SMTP credentials are not configured.');
    }

    const provider = this.configService.get<string>('EMAIL_PROVIDER') || 'resend';
    const hasSmtp = !!host;
    const activeProvider = hasSmtp ? 'smtp' : provider.toLowerCase();

    this.logger.log(`Attempting to send email via active provider: ${activeProvider}`);

    if (activeProvider === 'smtp') {
      await this.smtpEmailService.sendEmail(to, subject, bodyHtml, bodyText);
    } else if (activeProvider === 'resend') {
      await this.resendEmailService.sendEmail(to, subject, bodyHtml, bodyText);
    } else if (activeProvider === 'sendgrid') {
      await this.sendgridEmailService.sendEmail({ to, subject, html: bodyHtml });
    } else if (activeProvider === 'ses') {
      await this.sesMailService.sendEmail(to, subject, bodyHtml, bodyText);
    } else {
      throw new Error(`Unsupported email provider: ${activeProvider}`);
    }
  }
}
