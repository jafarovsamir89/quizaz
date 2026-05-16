import { Controller, Get, Query, UseGuards, Param, ParseIntPipe } from '@nestjs/common';
import { LeaderboardsService } from './leaderboards.service';
import { FirebaseAuthGuard } from '../auth/guards/firebase-auth.guard';
import { GetUser } from '../auth/user.decorator';
import type { User } from '@prisma/client';
import { OptionalAuthGuard } from '../auth/guards/optional-auth.guard';

@Controller('leaderboards')
export class LeaderboardsController {
  constructor(private readonly leaderboardsService: LeaderboardsService) {}

  @Get('cities')
  getCities(@Query('period') period = 'weekly') {
    return this.leaderboardsService.getCitiesRanking(period);
  }

  @Get('players')
  getPlayers(
    @Query('period') period = 'weekly',
    @Query('cityId') cityId?: string,
  ) {
    return this.leaderboardsService.getPlayersRanking(period, cityId ? parseInt(cityId) : undefined);
  }

  @Get('me')
  @UseGuards(FirebaseAuthGuard)
  getMyRank(
    @GetUser() user: User,
    @Query('period') period = 'weekly',
  ) {
    return this.leaderboardsService.getMyRank(user.id, period);
  }

  @Get('cities/:cityId/players')
  getCityPlayers(
    @Param('cityId', ParseIntPipe) cityId: number,
    @Query('period') period = 'weekly',
  ) {
    return this.leaderboardsService.getPlayersRanking(period, cityId);
  }
}
