import { Controller, Get, Post, Body, Param, UseGuards, ParseUUIDPipe } from '@nestjs/common';
import { GamesService } from './games.service';
import { FirebaseAuthGuard } from '../auth/guards/firebase-auth.guard';
import { GetUser } from '../auth/user.decorator';
import type { User } from '@prisma/client';
import { StartSoloDto, SubmitSoloAnswerDto } from './dto/game.dto';

@Controller('game')
@UseGuards(FirebaseAuthGuard)
export class GamesController {
  constructor(private readonly gamesService: GamesService) {}

  @Post('solo/start')
  startSolo(@GetUser() user: User, @Body() dto: StartSoloDto) {
    return this.gamesService.startSolo(user.id, dto.categoryId, dto.difficulty, dto.limit);
  }

  @Post('solo/:sessionId/answer')
  submitAnswer(
    @GetUser() user: User,
    @Param('sessionId', ParseUUIDPipe) sessionId: string,
    @Body() dto: SubmitSoloAnswerDto,
  ) {
    return this.gamesService.submitAnswer(user.id, sessionId, dto.questionId, dto.selectedOption, dto.timeSpentMs);
  }

  @Post('solo/:sessionId/finish')
  finishSolo(@GetUser() user: User, @Param('sessionId', ParseUUIDPipe) sessionId: string) {
    return this.gamesService.finishSolo(user.id, sessionId);
  }

  @Get('sessions/:sessionId')
  getSession(@GetUser() user: User, @Param('sessionId', ParseUUIDPipe) sessionId: string) {
    return this.gamesService.getSession(user.id, sessionId);
  }
}
