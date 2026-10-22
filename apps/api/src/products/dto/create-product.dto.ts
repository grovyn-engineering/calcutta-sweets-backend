import { Type } from 'class-transformer';
import {
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  MaxLength,
  Min,
} from 'class-validator';
import { Unit } from '@prisma/client';
import { PRICE_MAX, PRICE_MIN } from '../../common/money';

export class CreateProductDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(120)
  name!: string;

  @Type(() => Number)
  @IsNumber(
    { maxDecimalPlaces: 2, allowNaN: false, allowInfinity: false },
    { message: 'price must have at most 2 decimal places' },
  )
  @Min(PRICE_MIN, { message: 'price must be at least ₹0.01' })
  @Max(PRICE_MAX, { message: 'price cannot exceed ₹10,00,000' })
  price!: number;

  @IsOptional()
  @IsString()
  @MaxLength(64)
  barcode?: string;

  @IsOptional()
  @IsUUID()
  categoryId?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 3 })
  @Min(0)
  @Max(1_000_000)
  quantity?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @Max(PRICE_MAX)
  costPrice?: number;

  @IsOptional()
  @IsString()
  @MaxLength(64)
  sku?: string;

  @IsOptional()
  @IsEnum(Unit)
  unit?: Unit;

  @IsOptional()
  @IsString()
  hsnCode?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 3 })
  @Min(0)
  @Max(1_000_000)
  minStock?: number;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  isListedOnWebsite?: boolean;

  @IsOptional()
  @IsString()
  variantName?: string;
}
