import { Module } from '@nestjs/common';
import { LeaderboardsService } from './leaderboards.service';
import { LeaderboardsController } from './leaderboards.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  providers: [LeaderboardsService],
  controllers: [LeaderboardsController]
})
export class LeaderboardsModule {}
