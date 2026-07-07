import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import { ResendEmailService } from './services/resend-email.service';
import { EmailService } from './services/email-service';

@Module({
  providers: [EmailService, ResendEmailService, ConfigService],
  exports: [EmailService],
})
export class EmailModule {}
