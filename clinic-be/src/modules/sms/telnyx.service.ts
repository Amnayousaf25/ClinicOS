import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { SmsResult } from './lifetime.service';

@Injectable()
export class TelnyxService {
  private readonly logger = new Logger(TelnyxService.name);
  private readonly apiKey: string | undefined;
  private readonly profileId: string | undefined;
  private readonly fromNumber: string | undefined;
  private readonly apiUrl = 'https://api.telnyx.com/v2/messages';

  readonly isConfigured: boolean;

  constructor(private config: ConfigService) {
    this.apiKey = this.config.get<string>('TELYNX_API_KEY');
    this.profileId = this.config.get<string>('TELNYX_MESSAGING_PROFILE_ID');
    this.fromNumber = this.config.get<string>('TELNYX_FROM');
    this.isConfigured = !!this.apiKey;

    if (this.isConfigured) {
      this.logger.log('Telnyx provider ready');
    }
  }

  private buildPayload(to: string, text: string, sendAt?: string) {
    const normalized = to.startsWith('+') ? to : `+${to}`;
    const payload: Record<string, any> = { to: normalized, text };
    if (this.fromNumber) {
      payload.from = this.fromNumber;
    } else if (this.profileId) {
      payload.messaging_profile_id = this.profileId;
    }
    if (sendAt) payload.send_at = sendAt;
    return payload;
  }

  /** Send immediately */
  async send(to: string, body: string): Promise<SmsResult> {
    return this.post(this.buildPayload(to, body));
  }

  /**
   * Schedule SMS for future delivery.
   * send_at must be ISO 8601 UTC, 5 min–5 days from now.
   * Returns the Telnyx message ID needed for cancellation.
   */
  async schedule(to: string, body: string, sendAt: Date): Promise<SmsResult> {
    const iso = sendAt.toISOString();
    this.logger.log(`Scheduling SMS to ${to.slice(-4)} at ${iso}`);
    return this.post(this.buildPayload(to, body, iso));
  }

  /**
   * Cancel a previously scheduled message.
   * Only works if message status is 'scheduled' and send_at > 1 min from now.
   */
  async cancelScheduled(messageId: string): Promise<boolean> {
    try {
      const res = await fetch(`${this.apiUrl}/${messageId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${this.apiKey}` },
      });

      if (res.ok || res.status === 204) {
        this.logger.log(`Telnyx scheduled message cancelled: ${messageId}`);
        return true;
      }

      const data = await res.json().catch(() => ({}));
      const err = data?.errors?.[0]?.detail || res.statusText;
      this.logger.warn(`Telnyx cancel failed for ${messageId}: ${err}`);
      return false;
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Unknown error';
      this.logger.error(`Telnyx cancel error for ${messageId}: ${msg}`);
      return false;
    }
  }

  private async post(payload: Record<string, any>): Promise<SmsResult> {
    try {
      const res = await fetch(this.apiUrl, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (res.ok && data?.data?.id) {
        const status = data.data.status || 'sent';
        this.logger.log(`Telnyx ${status}: ${data.data.id}`);
        return { success: true, sid: data.data.id };
      }

      const err = data?.errors?.[0]?.detail || JSON.stringify(data);
      this.logger.error(`Telnyx failed: ${err}`);
      return { success: false, error: err };
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Unknown error';
      this.logger.error(`Telnyx error: ${msg}`);
      return { success: false, error: msg };
    }
  }
}
