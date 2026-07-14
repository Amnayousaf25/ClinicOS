import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export type SmsResult = { success: boolean; sid?: string; error?: string };

@Injectable()
export class LifetimeService {
  private readonly logger = new Logger(LifetimeService.name);
  private readonly apiToken: string | undefined;
  private readonly apiSecret: string | undefined;
  private readonly apiUrl = 'https://lifetimesms.com/json';
  private readonly sender: string;

  readonly isConfigured: boolean;

  constructor(private config: ConfigService) {
    this.apiToken = this.config.get<string>('LIFE_TIME_API_TOKEN');
    this.apiSecret = this.config.get<string>('LIFE_TIME_API_SECRET');
    this.sender = this.config.get<string>('LIFE_TIME_FROM') || 'SMS Alert';
    this.isConfigured = !!(this.apiToken && this.apiSecret);

    if (this.isConfigured) {
      this.logger.log('LifetimeSMS provider ready');
    }
  }

  /**
   * LifetimeSMS expects the destination number in international format
   * without the leading `+` (e.g. `923001234567`). Strip the `+` so
   * callers can pass E.164 (`+923001234567`) consistently with Telnyx.
   */
  private formatRecipient(to: string): string {
    return to.replace(/^\+/, '').replace(/\s+/g, '');
  }

  async send(to: string, body: string): Promise<SmsResult> {
    const params = new URLSearchParams();
    params.append('api_token', this.apiToken!);
    params.append('api_secret', this.apiSecret!);
    params.append('to', this.formatRecipient(to));
    params.append('from', this.sender);
    params.append('message', body);

    const res = await fetch(this.apiUrl, { method: 'POST', body: params });
    const data = await res.json();
    const msg = data?.messages?.[0];

    if (res.ok && msg?.status === 1) {
      const id = msg.messageid || 'sent';
      this.logger.log(`LifetimeSMS sent: ${id} (credit: ${data.remaincredit})`);
      return { success: true, sid: id };
    }

    const err = msg?.error || JSON.stringify(data);
    this.logger.error(`LifetimeSMS failed: ${err}`);
    return { success: false, error: err };
  }
}
