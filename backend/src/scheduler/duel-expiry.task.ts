import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { DuelsService } from '../duels/duels.service';

@Injectable()
export class DuelExpiryTask {
  private readonly logger = new Logger(DuelExpiryTask.name);

  constructor(private readonly duelsService: DuelsService) {}

  /** Run every 30 minutes — expire stale duels and auto-finalize where possible */
  @Cron(CronExpression.EVERY_30_MINUTES)
  async handleExpiry() {
    this.logger.log('Running duel expiry task...');
    try {
      const result = await this.duelsService.expireStale();
      this.logger.log(`Expiry task done: ${JSON.stringify(result)}`);
    } catch (err) {
      this.logger.error('Duel expiry task failed', err);
    }
  }
}
