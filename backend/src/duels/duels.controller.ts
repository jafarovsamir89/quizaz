import { Controller, Get, Post, Body, Param, UseGuards } from '@nestjs/common';
import { DuelsService } from './duels.service';
import { FirebaseAuthGuard } from '../auth/guards/firebase-auth.guard';
import { AdminGuard } from '../auth/guards/admin.guard';
import { GetUser } from '../auth/user.decorator';
import type { User } from '@prisma/client';
import { ParseUUIDPipe } from '@nestjs/common';
import { SubmitDuelAnswerDto } from './dto/submit-answer.dto';

@Controller('duels')
@UseGuards(FirebaseAuthGuard)
export class DuelsController {
  constructor(private readonly duelsService: DuelsService) {}

  @Post('find-or-create')
  findOrCreate(@GetUser() user: User) {
    return this.duelsService.findOrCreate(user.id);
  }

  @Get('my')
  getMyDuels(@GetUser() user: User) {
    return this.duelsService.getMyDuels(user.id);
  }

  @Get(':id')
  getDuel(@Param('id', ParseUUIDPipe) id: string) {
    return this.duelsService.getDuel(id);
  }

  @Post(':id/answer')
  submitAnswer(
    @GetUser() user: User,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: SubmitDuelAnswerDto,
  ) {
    return this.duelsService.submitAnswer(user.id, id, dto.questionId, dto.selectedOption, dto.timeSpentMs);
  }

  @Post(':id/finish')
  finishSide(@GetUser() user: User, @Param('id', ParseUUIDPipe) id: string) {
    return this.duelsService.finishSide(user.id, id);
  }

  @Post(':id/cancel')
  cancelDuel(@GetUser() user: User, @Param('id', ParseUUIDPipe) id: string) {
    return this.duelsService.cancelDuel(user.id, id);
  }

  /** Admin: manually trigger expiry cleanup */
  @Post('admin/expire-stale')
  @UseGuards(AdminGuard)
  expireStale() {
    return this.duelsService.expireStale();
  }
}
