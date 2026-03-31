import {
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Min,
  MinLength,
} from 'class-validator';
import { Type } from 'class-transformer';

export class LineItemInputDto {
  @IsString()
  @MinLength(1)
  description!: string;

  @IsNumber()
  @Min(0)
  @Type(() => Number)
  quantity!: number;

  @IsInt()
  @Min(0)
  unitPriceCents!: number;

  @IsOptional()
  @IsInt()
  sortOrder?: number;
}
