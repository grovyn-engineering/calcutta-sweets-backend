import { Unit } from '@prisma/client';
import {
  IsBoolean,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  MaxLength,
  Min,
  ValidateIf,
} from 'class-validator';
import { PRICE_MAX, PRICE_MIN } from '../../common/money';

export class UpdateVariantDto {
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(1_000_000)
  quantity?: number;

  /** The stock value the user saw before editing; a mismatch returns 409 instead of overwriting a sale. */
  @IsOptional()
  @IsNumber()
  expectedQuantity?: number;

  /** Reason recorded in the stock ledger for a quantity change. */
  @IsOptional()
  @IsString()
  @MaxLength(200)
  stockNote?: string;

  @IsOptional()
  @ValidateIf((_, v) => v != null)
  @IsNumber()
  @Min(0)
  @Max(1_000_000)
  minStock?: number | null;

  @IsOptional()
  @IsNumber(
    { maxDecimalPlaces: 2, allowNaN: false, allowInfinity: false },
    { message: 'price must have at most 2 decimal places' },
  )
  @Min(PRICE_MIN, { message: 'price must be at least ₹0.01' })
  @Max(PRICE_MAX, { message: 'price cannot exceed ₹10,00,000' })
  price?: number;

  @IsOptional()
  @ValidateIf((_, v) => v != null)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @Max(PRICE_MAX)
  costPrice?: number | null;

  /** GST percent (CGST+SGST) for this item's HSN; null = shop default. */
  @IsOptional()
  @ValidateIf((_, v) => v != null)
  @IsNumber()
  @Min(0)
  @Max(40)
  taxRate?: number | null;

  @IsOptional()
  @ValidateIf((_, v) => v != null)
  @IsString()
  @MaxLength(64)
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
  @IsBoolean()
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
