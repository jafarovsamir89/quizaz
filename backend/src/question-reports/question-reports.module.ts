import { Module } from '@nestjs/common';
import { QuestionReportsService } from './question-reports.service';
import { QuestionReportsController, UserQuestionReportsController } from './question-reports.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [QuestionReportsController, UserQuestionReportsController],
  providers: [QuestionReportsService],
})
export class QuestionReportsModule {}
