import { Unit } from '@prisma/client';
import {
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  ValidateIf,
} from 'class-validator';

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

  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  productName?: string;

  @IsOptional()
  @ValidateIf((_, v) => v != null)
  @IsUUID()
  categoryId?: string | null;

  @IsOptional()
  @IsString()
  barcode?: string;
}
