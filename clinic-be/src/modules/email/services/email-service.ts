import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';
import * as Handlebars from 'handlebars';
import { ConfigService } from '@nestjs/config';
import { SmtpEmailService } from './smtp-email.service';

@Injectable()
export class EmailService implements OnModuleInit {
  private readonly logger = new Logger(EmailService.name);

  constructor(
    private readonly configService: ConfigService,
    private readonly smtpEmailService: SmtpEmailService,
  ) {}

  onModuleInit() {
    const host =
      this.configService.get<string>('MAIL_HOST') ||
      this.configService.get<string>('SMTP_HOST');
    const user =
      this.configService.get<string>('MAIL_USER') ||
      this.configService.get<string>('SMTP_USER');
    const pass =
      this.configService.get<string>('MAIL_PASSWORD') ||
      this.configService.get<string>('SMTP_PASS');
    const from =
      this.configService.get<string>('MAIL_FROM') ||
      this.configService.get<string>('SMTP_FROM') ||
      this.configService.get<string>('EMAIL_FROM');

    // Diagnostic logs to troubleshoot production environment loading
    const envKeys = Object.keys(process.env).filter(
      (k) => k.startsWith('MAIL_') || k.startsWith('SMTP_') || k.startsWith('EMAIL_'),
    );
    this.logger.log(`[SMTP Diagnostic] Environment variable keys found: ${envKeys.join(', ')}`);

    const configStates = {
      MAIL_HOST: !!this.configService.get('MAIL_HOST'),
      SMTP_HOST: !!this.configService.get('SMTP_HOST'),
      MAIL_USER: !!this.configService.get('MAIL_USER'),
      SMTP_USER: !!this.configService.get('SMTP_USER'),
      MAIL_PASSWORD: !!this.configService.get('MAIL_PASSWORD'),
      SMTP_PASS: !!this.configService.get('SMTP_PASS'),
      MAIL_FROM: !!this.configService.get('MAIL_FROM'),
      SMTP_FROM: !!this.configService.get('SMTP_FROM'),
      EMAIL_FROM: !!this.configService.get('EMAIL_FROM'),
      NODE_ENV: this.configService.get('NODE_ENV') || 'undefined',
    };
    this.logger.log(`[SMTP Diagnostic] ConfigService keys resolved: ${JSON.stringify(configStates)}`);

    const isPlaceholder =
      !user ||
      user === 'your_email@gmail.com' ||
      !pass ||
      pass === 'your_app_password';

    if (isPlaceholder) {
      this.logger.warn(
        `SMTP Configuration: NOT DETECTED or using placeholder values (User: ${user || 'none'}).`,
      );
    } else {
      this.logger.log(
        `SMTP Configuration: DETECTED. Host: ${host || 'none'}, User: ${user}, From: ${from || 'none'}.`,
      );
    }
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
        `[EMAIL NOT SENT] Placeholder SMTP credentials detected (MAIL_USER=${user}). Please configure actual credentials in .env.dev to receive actual emails!`,
      );
      const isDev = this.configService.get<string>('NODE_ENV') === 'dev';
      if (isDev) {
        return { success: true, dryRun: true };
      }
      throw new Error('SMTP credentials are not configured.');
    }

    this.logger.log(`Attempting to send email via active provider: smtp`);
    await this.smtpEmailService.sendEmail(to, subject, bodyHtml, bodyText);
  }
}
