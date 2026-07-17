import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { LifetimeService, type SmsResult } from './lifetime.service';
import { TelnyxService } from './telnyx.service';

@Injectable()
export class SmsService {
  private readonly logger = new Logger(SmsService.name);

  constructor(
    private lifetime: LifetimeService,
    private telnyx: TelnyxService,
    private config: ConfigService,
  ) {
    if (!lifetime.isConfigured && !telnyx.isConfigured) {
      this.logger.warn('No SMS providers configured — dry-run mode');
    }
  }

  private maskPhone(phone: string): string {
    if (!phone) return 'unknown';
    if (phone.length <= 4) return '*'.repeat(phone.length);
    return '*'.repeat(phone.length - 4) + phone.slice(-4);
  }

  private normalizePhone(phone: string): string {
    const compact = phone.replace(/[\s().-]/g, '');
    if (compact.startsWith('+')) return compact;
    if (compact.startsWith('00')) return `+${compact.slice(2)}`;
    if (compact.startsWith('03') && compact.length === 11) {
      return `+92${compact.slice(1)}`;
    }
    if (compact.startsWith('3') && compact.length === 10) {
      return `+92${compact}`;
    }
    if (compact.startsWith('92')) return `+${compact}`;
    return compact;
  }

  private isPakistan(phone: string): boolean {
    return this.normalizePhone(phone).startsWith('+92');
  }  /** Send SMS immediately */
  async sendSms(to: string, body: string): Promise<SmsResult> {
    const normalizedTo = this.normalizePhone(to);
    const masked = this.maskPhone(normalizedTo);
    this.logger.log(`SMS to ${masked} (len=${body.length})`);

    const isDev = process.env.NODE_ENV === 'dev';

    try {
      if (this.isPakistan(normalizedTo)) {
        if (this.lifetime.isConfigured) {
          const res = await this.lifetime.send(normalizedTo, body);
          return res;
        } else {
          if (isDev) {
            this.logger.warn(
              `[DRY RUN] SMS to Pakistan number ${masked} (LifetimeSMS not configured)`,
            );
            return { success: true, sid: 'dry-run-pk' };
          }
          return { success: false, error: 'lifetime_not_configured' };
        }
      } else {
        if (this.telnyx.isConfigured) {
          const res = await this.telnyx.send(normalizedTo, body);
          return res;
        }
        if (this.lifetime.isConfigured) {
          const res = await this.lifetime.send(normalizedTo, body);
          return res;
        }
        if (isDev) {
          this.logger.warn(
            `[DRY RUN] SMS to international number ${masked} (No SMS providers configured)`,
          );
          return { success: true, sid: 'dry-run-intl' };
        }
        return { success: false, error: 'no_sms_provider_configured' };
      }
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Unknown error';
      this.logger.error(`SMS error to ${masked}: ${msg}`);
      return { success: false, error: msg };
    }
  }

  /**
   * Schedule SMS for future delivery via Telnyx.
   * Returns the Telnyx message ID (needed to cancel later).
   * Falls back to null if scheduling isn't possible (Pakistan numbers or no Telnyx).
   */
  async scheduleSms(
    to: string,
    body: string,
    sendAt: Date,
  ): Promise<SmsResult & { scheduled: boolean }> {
    const normalizedTo = this.normalizePhone(to);
    const masked = this.maskPhone(normalizedTo);

    // Telnyx constraint: 5 min – 5 days from now
    const now = Date.now();
    const delayMs = sendAt.getTime() - now;
    const fiveMin = 5 * 60 * 1000;
    const fiveDays = 5 * 24 * 60 * 60 * 1000;

    if (delayMs < fiveMin || delayMs > fiveDays) {
      this.logger.warn(
        `Cannot schedule SMS to ${masked}: send_at ${sendAt.toISOString()} outside 5min–5day window`,
      );
      return {
        success: false,
        scheduled: false,
        error: 'outside_schedule_window',
      };
    }

    // Pakistan numbers can't use Telnyx scheduling — LifetimeSMS has no scheduling
    if (this.isPakistan(normalizedTo)) {
      this.logger.warn(
        `Cannot schedule SMS to ${masked}: Pakistan number, no scheduling support`,
      );
      return {
        success: false,
        scheduled: false,
        error: 'no_scheduling_for_pk',
      };
    }

    if (!this.telnyx.isConfigured) {
      this.logger.warn(
        `Cannot schedule SMS to ${masked}: Telnyx not configured`,
      );
      return {
        success: false,
        scheduled: false,
        error: 'telnyx_not_configured',
      };
    }

    try {
      const result = await this.telnyx.schedule(normalizedTo, body, sendAt);
      return { ...result, scheduled: result.success };
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Unknown error';
      this.logger.error(`Schedule SMS error to ${masked}: ${msg}`);
      return { success: false, scheduled: false, error: msg };
    }
  }

  /** Cancel a previously scheduled Telnyx SMS */
  async cancelScheduledSms(messageId: string): Promise<boolean> {
    if (!this.telnyx.isConfigured) return false;
    return this.telnyx.cancelScheduled(messageId);
  }
}
