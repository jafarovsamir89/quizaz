import { Module } from '@nestjs/common';
import { DuelExpiryTask } from './duel-expiry.task';
import { WeeklyTournamentTask } from './weekly-tournament.task';
import { DuelsModule } from '../duels/duels.module';
import { PrismaModule } from '../prisma/prisma.module';
import { WalletModule } from '../wallet/wallet.module';
import { HeroesModule } from '../heroes/heroes.module';

@Module({
  imports: [DuelsModule, PrismaModule, WalletModule, HeroesModule],
  providers: [DuelExpiryTask, WeeklyTournamentTask],
})
export class SchedulerModule {}
