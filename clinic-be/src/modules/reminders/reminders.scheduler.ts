import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { RemindersService } from './reminders.service';

@Injectable()
export class RemindersScheduler {
  private readonly logger = new Logger(RemindersScheduler.name);

  constructor(private remindersService: RemindersService) {}

  /**
   * Every hour: send any pending reminders whose time has arrived.
   * This only fires for PK numbers or appointments booked far in advance
   * that couldn't be scheduled via Telnyx.
   */
  @Cron(CronExpression.EVERY_HOUR)
  async handleDueReminders() {
    try {
      await this.remindersService.processScheduledReminders();
    } catch (err: any) {
      this.logger.error(`Due reminders failed: ${err.message}`);
    }
  }

  /**
   * Once a day at 2 AM: promote pending reminders entering the
   * 5-day Telnyx scheduling window to scheduled status.
   */
  @Cron('0 2 * * *')
  async handleUpcomingReminders() {
    try {
      await this.remindersService.scheduleUpcomingReminders();
    } catch (err: any) {
      this.logger.error(`Upcoming reminders failed: ${err.message}`);
    }
  }
}
