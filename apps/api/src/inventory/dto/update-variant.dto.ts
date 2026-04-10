import { Unit } from '@prisma/client';
import { IsEnum, IsNumber, IsOptional, IsString } from 'class-validator';

export class UpdateVariantDto {
  @IsOptional()
  @IsNumber()
  quantity?: number;

  @IsOptional()
  @IsNumber()
  minStock?: number | null;

  @IsOptional()
  @IsNumber()
  price?: number;

  @IsOptional()
  @IsNumber()
  costPrice?: number | null;

  @IsOptional()
  @IsString()
  sku?: string | null;

  @IsOptional()
  @IsEnum(Unit)
  unit?: Unit;

  @IsOptional()
  @IsString()
  hsnCode?: string | null;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  isListedOnWebsite?: boolean;

  @IsOptional()
  @IsString({ each: true })
  images?: string[];
}
