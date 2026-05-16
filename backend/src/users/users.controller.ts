import { Controller, Get, Patch, Body, UseGuards } from '@nestjs/common';
import { UsersService } from './users.service';
import { FirebaseAuthGuard } from '../auth/guards/firebase-auth.guard';
import { GetUser } from '../auth/user.decorator';
import type { User } from '@prisma/client';

@Controller('profile')
@UseGuards(FirebaseAuthGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('me')
  getMe(@GetUser() user: User) {
    return user;
  }

  @Patch('me')
  updateMe(@GetUser() user: User, @Body() updateData: any) {
    return this.usersService.update(user.id, updateData);
  }

  @Patch('city')
  updateCity(@GetUser() user: User, @Body('cityId') cityId: number) {
    return this.usersService.update(user.id, { cityId });
  }

  @Get('stats')
  getStats(@GetUser() user: User) {
    // Basic stats for now, can be expanded later
    return {
      level: user.level,
      xp: user.xp,
      balanceCoins: user.balanceCoins,
    };
  }
}
