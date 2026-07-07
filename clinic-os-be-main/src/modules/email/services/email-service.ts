import { Injectable } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';
import * as Handlebars from 'handlebars';
import { ResendEmailService } from './resend-email.service';

@Injectable()
export class EmailService {
  constructor(private readonly resendEmailService: ResendEmailService) {}

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
    await this.resendEmailService.sendEmail(to, subject, bodyHtml, bodyText);
  }
}
