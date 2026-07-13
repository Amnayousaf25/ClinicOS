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
    const provider = this.configService.get<string>('EMAIL_PROVIDER') || 'resend';
    
    // Auto-detect SMTP: if MAIL_HOST is defined, default to SMTP unless explicitly configured otherwise
    const hasSmtp = !!this.configService.get<string>('MAIL_HOST');
    const activeProvider = hasSmtp ? 'smtp' : provider.toLowerCase();

    this.logger.log(`Attempting to send email via active provider: ${activeProvider}`);

    try {
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
    } catch (error) {
      this.logger.error(`Failed to send email to ${to} using ${activeProvider}:`, error);
      throw error;
    }
  }
}
