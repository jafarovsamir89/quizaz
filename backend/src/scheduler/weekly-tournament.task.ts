import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../prisma/prisma.service';
import { WalletService } from '../wallet/wallet.service';
import { HeroesService } from '../heroes/heroes.service';

@Injectable()
export class WeeklyTournamentTask {
  private readonly logger = new Logger(WeeklyTournamentTask.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly wallet: WalletService,
    private readonly heroesService: HeroesService,
  ) {}

  /** Run every Sunday at midnight (Baku time equivalent or CronExpression.EVERY_WEEKEND) */
  @Cron(CronExpression.EVERY_WEEK)
  async finalizeWeeklyTournament() {
    this.logger.log('Finalizing Weekly High-Stakes Tournament...');

    try {
      // 1. Fetch top 3 weekly active players based on XP
      const topPlayers = await this.prisma.user.findMany({
        where: { xp: { gt: 0 } },
        orderBy: { xp: 'desc' },
        take: 3,
      });

      if (topPlayers.length === 0) {
        this.logger.log('No active players found this week. Skipping prize distribution.');
        return;
      }

      this.logger.log(`Weekly Winners Identified: ${topPlayers.map(p => p.nickname).join(', ')}`);

      // 2. Distribute prizes based on rankings
      // 1st Place
      if (topPlayers[0]) {
        const p1 = topPlayers[0];
        await this.wallet.addCoins(p1.id, 5000, 'weekly_tournament_p1_reward', { rank: 1 });
        await this.heroesService.awardRandomHero(p1.id, 'legendary');
        this.logger.log(`1st Place Prize Awarded to ${p1.nickname}: 5000 Coins + Legendary Hero`);
      }

      // 2nd Place
      if (topPlayers[1]) {
        const p2 = topPlayers[1];
        await this.wallet.addCoins(p2.id, 2500, 'weekly_tournament_p2_reward', { rank: 2 });
        await this.heroesService.awardRandomHero(p2.id, 'epic');
        this.logger.log(`2nd Place Prize Awarded to ${p2.nickname}: 2500 Coins + Epic Hero`);
      }

      // 3rd Place
      if (topPlayers[2]) {
        const p3 = topPlayers[2];
        await this.wallet.addCoins(p3.id, 1000, 'weekly_tournament_p3_reward', { rank: 3 });
        await this.heroesService.awardRandomHero(p3.id, 'rare');
        this.logger.log(`3rd Place Prize Awarded to ${p3.nickname}: 1000 Coins + Rare Hero`);
      }

      // 3. Reset weekly flags if any, or log stats
      this.logger.log('Weekly High-Stakes Tournament successfully completed and prizes distributed!');
    } catch (err: any) {
      this.logger.error('Failed to finalize weekly tournament', err);
    }
  }
}
