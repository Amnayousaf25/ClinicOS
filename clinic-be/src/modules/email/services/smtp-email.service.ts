import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';

@Injectable()
export class SmtpEmailService {
  private transporter: nodemailer.Transporter | null = null;
  private readonly logger = new Logger(SmtpEmailService.name);
  private from = 'support@clinicos.com';

  constructor(private configService: ConfigService) {
    const host =
      this.configService.get<string>('MAIL_HOST') ||
      this.configService.get<string>('SMTP_HOST');
    const port =
      this.configService.get<string | number>('MAIL_PORT') ||
      this.configService.get<string | number>('SMTP_PORT') ||
      587;
    const user =
      this.configService.get<string>('MAIL_USER') ||
      this.configService.get<string>('SMTP_USER');
    const pass =
      this.configService.get<string>('MAIL_PASSWORD') ||
      this.configService.get<string>('SMTP_PASS');
    this.from =
      this.configService.get<string>('MAIL_FROM') ||
      this.configService.get<string>('SMTP_FROM') ||
      this.configService.get<string>('EMAIL_FROM') ||
      'support@clinicos.com';

    // Support boolean configuration or auto-detect based on port 465
    let secure = false;
    const secureConfig =
      this.configService.get<string | boolean>('MAIL_SECURE') ||
      this.configService.get<string | boolean>('SMTP_SECURE');
    if (secureConfig !== undefined) {
      secure = String(secureConfig) === 'true';
    } else {
      secure = Number(port) === 465;
    }

    if (host && user && pass) {
      this.transporter = nodemailer.createTransport({
        host,
        port: Number(port),
        secure,
        auth: {
          user,
          pass,
        },
      });
      this.logger.log(
        `SMTP Mail transporter initialized (host: ${host}, port: ${port}, secure: ${secure})`,
      );
    } else {
      this.logger.warn(
        'SMTP credentials not fully set. SmtpEmailService will not be active.',
      );
    }
  }

  async sendEmail(
    to: string,
    subject: string,
    bodyHtml = '',
    bodyText?: string,
  ) {
    if (!this.transporter) {
      throw new Error(
        'SMTP transporter is not initialized. Check your environment variables.',
      );
    }

    const mailOptions = {
      from: this.from,
      to,
      subject,
      html: bodyHtml,
      text: bodyText,
    };

    try {
      const info = await this.transporter.sendMail(mailOptions);
      this.logger.log(
        `Email sent via SMTP to ${to} successfully. MessageId: ${info.messageId}`,
      );
      return info;
    } catch (error) {
      this.logger.error(`Error sending email via SMTP to ${to}:`, error);
      throw error;
    }
  }
}
