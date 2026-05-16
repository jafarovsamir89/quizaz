import { IsInt, IsString, IsIn, IsNumber, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';

export class SubmitDuelAnswerDto {
  @IsInt()
  @Type(() => Number)
  questionId: number;

  @IsString()
  @IsIn(['a', 'b', 'c', 'd', 'none'])
  selectedOption: string;

  @IsNumber()
  @Min(0)
  @Max(60000)
  @Type(() => Number)
  timeSpentMs: number;
}
