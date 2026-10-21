import { Type } from 'class-transformer';
import {
  IsNotEmpty,
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

export class UpdateProductDto {
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(120)
  name?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber(
    { maxDecimalPlaces: 2, allowNaN: false, allowInfinity: false },
    { message: 'price must have at most 2 decimal places' },
  )
  @Min(PRICE_MIN, { message: 'price must be at least ₹0.01' })
  @Max(PRICE_MAX, { message: 'price cannot exceed ₹10,00,000' })
  price?: number;

  @IsOptional()
  @IsString()
  barcode?: string;

  @IsOptional()
  @IsString()
  shopCode?: string;

  @IsOptional()
  @ValidateIf((_, v) => v != null)
  @IsUUID()
  categoryId?: string | null;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  isListedOnWebsite?: boolean;
}
