import { Module } from '@nestjs/common';
import { DuelExpiryTask } from './duel-expiry.task';
import { DuelsModule } from '../duels/duels.module';

@Module({
  imports: [DuelsModule],
  providers: [DuelExpiryTask],
})
export class SchedulerModule {}
