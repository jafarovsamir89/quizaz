import { IsString, IsNotEmpty, IsInt, IsOptional } from 'class-validator';

export class CreateQuestionReportDto {
  @IsInt()
  @IsOptional() // Set by controller from Param
  questionId?: number;

  @IsString()
  @IsNotEmpty()
  reason: string;
}
