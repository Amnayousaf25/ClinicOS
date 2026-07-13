import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import { ResendEmailService } from './services/resend-email.service';
import { EmailService } from './services/email-service';
import { SmtpEmailService } from './services/smtp-email.service';
import { SendgridEmailService } from './services/sendgrid-email.service';
import { SESMailService } from './services/ses-email.service';

@Module({
  providers: [
    EmailService,
    ResendEmailService,
    SmtpEmailService,
    SendgridEmailService,
    SESMailService,
    ConfigService,
  ],
  exports: [EmailService],
})
export class EmailModule {}
