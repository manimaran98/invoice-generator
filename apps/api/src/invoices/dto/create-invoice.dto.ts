import { Type } from 'class-transformer';
import {
  IsArray,
  IsISO8601,
  IsInt,
  IsOptional,
  IsString,
  Min,
  ValidateNested,
} from 'class-validator';
import { LineItemInputDto } from './line-item-input.dto';

export class CreateInvoiceDto {
  @IsString()
  clientId!: string;

  @IsOptional()
  @IsString()
  currency?: string;

  @IsISO8601()
  issueDate!: string;

  @IsOptional()
  @IsISO8601()
  dueDate?: string;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  taxCents?: number;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => LineItemInputDto)
  lineItems!: LineItemInputDto[];
}
