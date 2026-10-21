import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsDateString,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';
import { PRICE_MAX, PRICE_MIN } from '../../common/money';

export enum PaymentMethodEnum {
  CASH = 'CASH',
  UPI_CARD = 'UPI_CARD',
}

export class PosOrderLineDto {
  @IsOptional()
  @IsString()
  variantId?: string;

  @IsOptional()
  @IsString()
  customName?: string;

  @Type(() => Number)
  @IsNumber({ allowNaN: false, allowInfinity: false })
  @Min(0.001)
  @Max(100_000)
  quantity!: number;

  /**
   * For catalog lines this must match the current catalog price; the server prices the line.
   * Manual lines follow the same price policy as the catalog (see PRICE_MIN / PRICE_MAX).
   */
  @Type(() => Number)
  @IsNumber(
    { maxDecimalPlaces: 2, allowNaN: false, allowInfinity: false },
    { message: 'unitPrice must have at most 2 decimal places' },
  )
  @Min(PRICE_MIN, { message: 'unitPrice must be at least ₹0.01' })
  @Max(PRICE_MAX, { message: 'unitPrice cannot exceed ₹10,00,000' })
  unitPrice!: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0.000001)
  displayQuantity?: number;

  @IsOptional()
  @IsString()
  displayUnit?: string;
}

export class CreatePosOrderDto {
  @IsEnum(PaymentMethodEnum)
  paymentMethod!: PaymentMethodEnum;

  @IsOptional()
  @IsString()
  customerName?: string;

  @IsOptional()
  @IsString()
  customerPhone?: string;

  @IsOptional()
  @IsString()
  customerEmail?: string;

  @IsOptional()
  @IsString()
  customerAddress?: string;

  @IsOptional()
  @IsString()
  customerNotes?: string;

  @IsOptional()
  @IsString()
  customerGstin?: string;

  /** Flat bill discount in rupees; must not exceed the bill amount (checked in the service). */
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2, allowNaN: false, allowInfinity: false })
  @Min(0)
  discount?: number;

  /**
   * Optional backdated timestamp (ISO 8601) for the sale. When omitted, the
   * order is created with the current server time.
   */
  @IsOptional()
  @IsDateString()
  createdAt?: string;

  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => PosOrderLineDto)
  items!: PosOrderLineDto[];
}

export class CancelOrderDto {
  @IsOptional()
  @IsString()
  @MaxLength(500)
  reason?: string;
}
