import { IsString, IsNotEmpty, IsInt, IsEnum, IsObject, Min, Max, IsOptional, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

class OptionsDto {
  @IsString()
  @IsNotEmpty()
  a: string;

  @IsString()
  @IsNotEmpty()
  b: string;

  @IsString()
  @IsNotEmpty()
  c: string;

  @IsString()
  @IsNotEmpty()
  d: string;
}

export class CreateQuestionDto {
  @IsInt()
  @IsNotEmpty()
  categoryId: number;

  @IsString()
  @IsNotEmpty()
  textAz: string;

  @IsObject()
  @ValidateNested()
  @Type(() => OptionsDto)
  options: OptionsDto;

  @IsEnum(['a', 'b', 'c', 'd'])
  @IsNotEmpty()
  correctOption: string;

  @IsInt()
  @Min(1)
  @Max(5)
  difficulty: number;

  @IsString()
  @IsOptional()
  explanationAz?: string;
  
  @IsString()
  @IsOptional()
  status?: string;
}
