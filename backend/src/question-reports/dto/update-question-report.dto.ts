import { PartialType } from '@nestjs/mapped-types';
import { CreateQuestionReportDto } from './create-question-report.dto';

export class UpdateQuestionReportDto extends PartialType(CreateQuestionReportDto) {}
