import { Controller, Get, Post, Body, Param, UseGuards } from '@nestjs/common';
import { ClansService } from './clans.service';
import { FirebaseAuthGuard } from '../auth/guards/firebase-auth.guard';
import { GetUser } from '../auth/user.decorator';
import type { User } from '@prisma/client';

@Controller('clans')
@UseGuards(FirebaseAuthGuard)
export class ClansController {
  constructor(private readonly clansService: ClansService) {}

  @Post('create')
  createClan(
    @GetUser() user: User,
    @Body('name') name: string,
    @Body('type') type: string,
    @Body('logoUrl') logoUrl?: string,
  ) {
    return this.clansService.createClan(user.id, name, type, logoUrl);
  }

  @Post(':id/join')
  joinClan(@GetUser() user: User, @Param('id') id: string) {
    return this.clansService.joinClan(user.id, id);
  }

  @Post('leave')
  leaveClan(@GetUser() user: User) {
    return this.clansService.leaveClan(user.id);
  }

  @Get('leaderboard/:type')
  getLeaderboard(@Param('type') type: string) {
    return this.clansService.getLeaderboard(type);
  }

  @Get(':id')
  getClanDetails(@Param('id') id: string) {
    return this.clansService.getClanDetails(id);
  }
}
