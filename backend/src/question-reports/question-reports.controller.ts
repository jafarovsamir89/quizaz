import { Controller, Get, Post, Body, Patch, Param, ParseIntPipe, UseGuards } from '@nestjs/common';
import { QuestionReportsService } from './question-reports.service';
import { CreateQuestionReportDto } from './dto/create-question-report.dto';
import { FirebaseAuthGuard } from '../auth/guards/firebase-auth.guard';
import { AdminGuard } from '../auth/guards/admin.guard';
import { GetUser } from '../auth/user.decorator';
import type { User } from '@prisma/client';

/** Admin: manage all reports */
@Controller('question-reports')
@UseGuards(FirebaseAuthGuard, AdminGuard)
export class QuestionReportsController {
  constructor(private readonly questionReportsService: QuestionReportsService) {}

  @Get()
  findAll() {
    return this.questionReportsService.findAll();
  }

  @Patch(':id')
  updateStatus(
    @Param('id', ParseIntPipe) id: number,
    @Body('status') status: 'open' | 'resolved' | 'ignored',
    @Body('adminComment') adminComment?: string,
  ) {
    return this.questionReportsService.updateStatus(id, status, adminComment);
  }

  @Patch(':id/resolve')
  resolve(@Param('id', ParseIntPipe) id: number, @Body('adminComment') adminComment: string) {
    return this.questionReportsService.resolve(id, adminComment);
  }
}

/** Users: submit a report on a question */
@Controller('questions/:questionId/report')
@UseGuards(FirebaseAuthGuard)
export class UserQuestionReportsController {
  constructor(private readonly questionReportsService: QuestionReportsService) {}

  @Post()
  create(
    @Param('questionId', ParseIntPipe) questionId: number,
    @GetUser() user: User,
    @Body() createQuestionReportDto: CreateQuestionReportDto,
  ) {
    const data = {
      ...createQuestionReportDto,
      questionId,
      userId: user.id,
    };
    return this.questionReportsService.create(data);
  }
}
