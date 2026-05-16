import { IsInt, IsString, IsIn, IsNumber, Min, Max, IsOptional } from 'class-validator';
import { Type } from 'class-transformer';

export class StartSoloDto {
  @IsOptional()
  @IsInt()
  @Type(() => Number)
  categoryId?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(5)
  @Type(() => Number)
  difficulty?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(20)
  @Type(() => Number)
  limit?: number;
}

export class SubmitSoloAnswerDto {
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
