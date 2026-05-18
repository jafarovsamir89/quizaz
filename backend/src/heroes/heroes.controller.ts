import { Controller, Get, Post, Body, Param, UseGuards } from '@nestjs/common';
import { HeroesService } from './heroes.service';
import { FirebaseAuthGuard } from '../auth/guards/firebase-auth.guard';
import { GetUser } from '../auth/user.decorator';
import type { User } from '@prisma/client';

@Controller('heroes')
@UseGuards(FirebaseAuthGuard)
export class HeroesController {
  constructor(private readonly heroesService: HeroesService) {}

  @Get('all')
  getAllHeroes() {
    return this.heroesService.getAllHeroes();
  }

  @Get('my')
  getUserHeroes(@GetUser() user: User) {
    return this.heroesService.getUserHeroes(user.id);
  }

  @Post(':id/equip')
  equipHero(
    @GetUser() user: User,
    @Param('id') id: string,
    @Body('equip') equip: boolean,
  ) {
    return this.heroesService.equipHero(user.id, id, equip);
  }

  @Post('chest')
  openChest(@GetUser() user: User) {
    return this.heroesService.openChest(user.id);
  }

  @Post(':id/levelup')
  levelUpHero(@GetUser() user: User, @Param('id') id: string) {
    return this.heroesService.levelUpHero(user.id, id);
  }
}
