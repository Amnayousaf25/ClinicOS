import { Module } from '@nestjs/common';

import { EmailService } from './services/email-service';
import { SmtpEmailService } from './services/smtp-email.service';
import { ResendEmailService } from './services/resend-email.service';
import { BrevoEmailService } from './services/brevo-email.service';

@Module({
  providers: [
    EmailService,
    SmtpEmailService,
    ResendEmailService,
    BrevoEmailService,
  ],
  exports: [EmailService],
})
export class EmailModule {}
