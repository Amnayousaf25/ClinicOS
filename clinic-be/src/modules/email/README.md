# Email Module - API Usage

## Service Usage

This module provides email functionality via service injection. It supports multiple email providers (AWS SES, Brevo, SendGrid) and uses Handlebars templates for email content.

### Send Email

```typescript
import { EmailService } from './modules/email/services/email-service';

// Inject service
constructor(private readonly emailService: EmailService) {}

// Send email with HTML content
await this.emailService.sendEmail(
  'recipient@example.com',
  'Email Subject',
  '<h1>Hello World</h1>', // HTML body
  'Hello World' // Optional plain text body
);
```

**Parameters:**
- `to`: string (required) - Recipient email address
- `subject`: string (required) - Email subject
- `bodyHtml`: string (optional) - HTML content of the email
- `bodyText`: string (optional) - Plain text content of the email

### Load Email Template

```typescript
import { EmailService } from './modules/email/services/email-service';
import { ITemplates } from './modules/email/types/templates.type';

// Inject service
constructor(private readonly emailService: EmailService) {}

// Load and compile Handlebars template
const template = this.emailService.loadTemplate(
  ITemplates.OTP, // or ITemplates.FORGOT_PASSWORD, ITemplates.NEW_USER
  {
    otp: '123456',
    userName: 'John Doe'
  }
);

// Send email with template
await this.emailService.sendEmail(
  'recipient@example.com',
  'Your OTP Code',
  template
);
```

**Available Templates:**
- `ITemplates.OTP` - OTP verification template
- `ITemplates.FORGOT_PASSWORD` - Forgot password template
- `ITemplates.NEW_USER` - New user onboarding template

**Template Context:**
Templates are located in `src/email-templates/` directory and use Handlebars syntax. Pass context data as the second parameter to `loadTemplate()`.

### Direct Provider Usage

You can also use the provider services directly:

#### AWS SES Service

```typescript
import { SESMailService } from './modules/email/services/ses-email.service';

constructor(private readonly sesMailService: SESMailService) {}

await this.sesMailService.sendEmail(
  'recipient@example.com',
  'Subject',
  '<h1>HTML Content</h1>',
  'Plain text content'
);
```

#### Brevo Service (Commented out by default)

```typescript
import { BrevoEmailService } from './modules/email/services/brevo-email.service';

constructor(private readonly brevoEmailService: BrevoEmailService) {}

this.brevoEmailService.sendEmail({
  to: 'recipient@example.com',
  subject: 'Subject',
  html: '<h1>HTML Content</h1>'
});
```

#### SendGrid Service (Commented out by default)

```typescript
import { SendgridEmailService } from './modules/email/services/sendgrid-email.service';
import { SendEmailWithHtmlDto } from './modules/email/dto/send-email.dto';

constructor(private readonly sendgridEmailService: SendgridEmailService) {}

await this.sendgridEmailService.sendEmail({
  to: 'recipient@example.com',
  subject: 'Subject',
  html: '<h1>HTML Content</h1>'
});
```

## Configuration

The email module requires the following environment variables (depending on the provider):

### AWS SES
- `AWS_REGION` - AWS region
- `AWS_ACCESS_KEY_ID` - AWS access key
- `AWS_SECRET_ACCESS_KEY` - AWS secret key

### Brevo
- `EMAIL_CLIENT_API_KEY` - Brevo API key
- `EMAIL_SENDER` - Sender email address

### SendGrid
- `EMAIL_CLIENT_API_KEY` - SendGrid API key
- `EMAIL_SENDER` - Sender email address

## Module Setup

To use a different email provider, uncomment the desired service in `email.module.ts` and comment out the others:

```typescript
@Module({
  providers: [
    EmailService,
    SESMailService, // or BrevoEmailService, SendgridEmailService
    ConfigService,
  ],
  exports: [EmailService, SESMailService],
})
export class EmailModule {}
```

