import { Controller, Get, Post, Body, Patch, Param, Delete, Query, ParseIntPipe, UseGuards } from '@nestjs/common';
import { QuestionsService } from './questions.service';
import { CreateQuestionDto } from './dto/create-question.dto';
import { UpdateQuestionDto } from './dto/update-question.dto';
import { FirebaseAuthGuard } from '../auth/guards/firebase-auth.guard';
import { AdminGuard } from '../auth/guards/admin.guard';

@Controller('questions')
export class QuestionsController {
  constructor(private readonly questionsService: QuestionsService) {}

  @Post()
  @UseGuards(FirebaseAuthGuard, AdminGuard)
  create(@Body() createQuestionDto: CreateQuestionDto) {
    return this.questionsService.create(createQuestionDto);
  }

  @Post('import')
  @UseGuards(FirebaseAuthGuard, AdminGuard)
  importBulk(@Body() questions: CreateQuestionDto[]) {
    return this.questionsService.importBulk(questions);
  }

  @Get()
  @UseGuards(FirebaseAuthGuard, AdminGuard)
  findAll() {
    return this.questionsService.findAll();
  }

  @Get('random')
  @UseGuards(FirebaseAuthGuard) // Requires being at least a guest
  getRandom(
    @Query('categoryId') categoryId?: string,
    @Query('difficulty') difficulty?: string,
    @Query('limit') limit?: string,
  ) {
    return this.questionsService.getRandom(
      categoryId ? parseInt(categoryId) : undefined,
      difficulty ? parseInt(difficulty) : undefined,
      limit ? parseInt(limit) : undefined,
    );
  }

  @Get(':id')
  @UseGuards(FirebaseAuthGuard, AdminGuard)
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.questionsService.findOne(id);
  }

  @Patch(':id')
  @UseGuards(FirebaseAuthGuard, AdminGuard)
  update(@Param('id', ParseIntPipe) id: number, @Body() updateQuestionDto: UpdateQuestionDto) {
    return this.questionsService.update(id, updateQuestionDto);
  }

  @Delete(':id')
  @UseGuards(FirebaseAuthGuard, AdminGuard)
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.questionsService.remove(id);
  }
}
