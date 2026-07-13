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
    if (compact.startsWith('92')) return `+${compact}`;
    return compact;
  }

  private isPakistan(phone: string): boolean {
    return this.normalizePhone(phone).startsWith('+92');
  }

  /** Send SMS immediately */
  async sendSms(to: string, body: string): Promise<SmsResult> {
    const normalizedTo = this.normalizePhone(to);
    const masked = this.maskPhone(normalizedTo);
    this.logger.log(`SMS to ${masked} (len=${body.length})`);

    const isDev = process.env.NODE_ENV === 'dev';
    const whatsappApiKey = this.config.get<string>('WHATSAPP_API_KEY');
    const whatsappPhone = this.config.get<string>('WHATSAPP_PHONE');

    if (isDev && whatsappApiKey && whatsappPhone) {
      this.logger.log(`[DEV ONLY] Routing SMS to WhatsApp via CallMeBot...`);
      const result = await this.sendWhatsAppCallMeBot(
        `[SMS for ${to}] ${body}`,
      );
      if (result.success) return result;
    }

    try {
      if (this.isPakistan(normalizedTo)) {
        if (this.lifetime.isConfigured) {
          const res = await this.lifetime.send(normalizedTo, body);
          if (!res.success && isDev) {
            this.logger.warn(
              `[DEV FALLBACK] LifetimeSMS failed, falling back to dry-run success: ${res.error}`,
            );
            return { success: true, sid: 'dry-run-pk-fallback' };
          }
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
          if (!res.success && isDev) {
            this.logger.warn(
              `[DEV FALLBACK] Telnyx failed, falling back to dry-run success: ${res.error}`,
            );
            return { success: true, sid: 'dry-run-telnyx-fallback' };
          }
          return res;
        }
        if (this.lifetime.isConfigured) {
          const res = await this.lifetime.send(normalizedTo, body);
          if (!res.success && isDev) {
            this.logger.warn(
              `[DEV FALLBACK] LifetimeSMS failed, falling back to dry-run success: ${res.error}`,
            );
            return { success: true, sid: 'dry-run-pk-fallback' };
          }
          return res;
        }
      }
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Unknown error';
      this.logger.error(`SMS error to ${masked}: ${msg}`);
      if (isDev) {
        this.logger.warn(
          `[DEV FALLBACK] SMS error caught, falling back to dry-run success`,
        );
        return { success: true, sid: 'dry-run-error-fallback' };
      }
      return { success: false, error: msg };
    }

    this.logger.warn(`[DRY RUN] SMS to ${masked}`);
    return { success: true, sid: 'dry-run' };
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

    const isDev = process.env.NODE_ENV === 'dev';
    const whatsappApiKey = this.config.get<string>('WHATSAPP_API_KEY');
    const whatsappPhone = this.config.get<string>('WHATSAPP_PHONE');

    if (isDev && whatsappApiKey && whatsappPhone) {
      this.logger.log(`[DEV ONLY] Routing Scheduled SMS to WhatsApp via CallMeBot...`);
      await this.sendWhatsAppCallMeBot(
        `[SCHEDULED for ${sendAt.toISOString()} to ${to}] ${body}`,
      );
      return { success: true, scheduled: true, sid: 'callmebot-wa-scheduled' };
    }

    // Telnyx constraint: 5 min – 5 days from now
    const now = Date.now();
    const delayMs = sendAt.getTime() - now;
    const fiveMin = 5 * 60 * 1000;
    const fiveDays = 5 * 24 * 60 * 60 * 1000;

    if (delayMs < fiveMin || delayMs > fiveDays) {
      this.logger.warn(
        `Cannot schedule SMS to ${masked}: send_at ${sendAt.toISOString()} outside 5min–5day window`,
      );
      if (isDev) {
        this.logger.warn(
          `[DEV FALLBACK] Simulating scheduled SMS outside 5min-5day window to ${masked}`,
        );
        return {
          success: true,
          scheduled: true,
          sid: 'dry-run-schedule-window-fallback',
        };
      }
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
      if (isDev) {
        this.logger.warn(
          `[DEV FALLBACK] Simulating scheduled SMS to Pakistan number ${masked}`,
        );
        return {
          success: true,
          scheduled: true,
          sid: 'dry-run-schedule-pk',
        };
      }
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
      if (isDev) {
        this.logger.warn(
          `[DEV FALLBACK] Simulating scheduled SMS to ${masked} (no Telnyx)`,
        );
        return {
          success: true,
          scheduled: true,
          sid: 'dry-run-schedule-telnyx',
        };
      }
      return {
        success: false,
        scheduled: false,
        error: 'telnyx_not_configured',
      };
    }

    try {
      const result = await this.telnyx.schedule(normalizedTo, body, sendAt);
      if (!result.success && isDev) {
        this.logger.warn(
          `[DEV FALLBACK] Telnyx schedule failed, falling back to dry-run success: ${result.error}`,
        );
        return { success: true, scheduled: true, sid: 'dry-run-schedule-telnyx-fallback' };
      }
      return { ...result, scheduled: result.success };
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Unknown error';
      this.logger.error(`Schedule SMS error to ${masked}: ${msg}`);
      if (isDev) {
        this.logger.warn(
          `[DEV FALLBACK] Schedule SMS error caught, falling back to dry-run success`,
        );
        return { success: true, scheduled: true, sid: 'dry-run-schedule-error-fallback' };
      }
      return { success: false, scheduled: false, error: msg };
    }
  }

  /** Cancel a previously scheduled Telnyx SMS */
  async cancelScheduledSms(messageId: string): Promise<boolean> {
    if (!this.telnyx.isConfigured) return false;
    return this.telnyx.cancelScheduled(messageId);
  }

  private async sendWhatsAppCallMeBot(body: string): Promise<SmsResult> {
    const phone = this.config.get<string>('WHATSAPP_PHONE') || '';
    const apikey = this.config.get<string>('WHATSAPP_API_KEY') || '';
    if (!phone || !apikey) return { success: false, error: 'whatsapp_not_configured' };

    const normalizedPhone = phone.replace(/^\+/, '').replace(/\s+/g, '');
    try {
      const encodedText = encodeURIComponent(body);
      const url = `https://api.callmebot.com/whatsapp.php?phone=${normalizedPhone}&text=${encodedText}&apikey=${apikey}`;
      const res = await fetch(url);
      if (res.ok) {
        this.logger.log(`WhatsApp message sent successfully via CallMeBot to ${normalizedPhone}`);
        return { success: true, sid: 'callmebot-wa' };
      }
      const errText = await res.text();
      throw new Error(`CallMeBot returned ${res.status}: ${errText}`);
    } catch (err: any) {
      this.logger.error('Failed to send WhatsApp message:', err);
      return { success: false, error: err.message };
    }
  }
}
