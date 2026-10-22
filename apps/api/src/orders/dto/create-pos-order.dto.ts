import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayMinSize,
  ArrayUnique,
  IsArray,
  IsDateString,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
  ValidateIf,
  ValidateNested,
  Matches,
} from 'class-validator';
import { CUSTOMER_NAME_MAX_LENGTH } from '../../common/customer';
import { BILL_TOTAL_MAX, PRICE_MAX, PRICE_MIN } from '../../common/money';
import { GSTIN_MESSAGE, GSTIN_OR_EMPTY } from '../../common/gstin';

export enum PaymentMethodEnum {
  CASH = 'CASH',
  UPI = 'UPI',
  CARD = 'CARD',
  SPLIT = 'SPLIT',
  /** Legacy combined mode; still accepted from older POS clients. */
  UPI_CARD = 'UPI_CARD',
}

export enum PaymentLegMethodEnum {
  CASH = 'CASH',
  UPI = 'UPI',
  CARD = 'CARD',
}

export class PosPaymentLegDto {
  @IsEnum(PaymentLegMethodEnum)
  method!: PaymentLegMethodEnum;

  @Type(() => Number)
  @IsNumber(
    { maxDecimalPlaces: 2, allowNaN: false, allowInfinity: false },
    { message: 'payment amount must have at most 2 decimal places' },
  )
  @Min(0.01, { message: 'payment amount must be at least ₹0.01' })
  @Max(BILL_TOTAL_MAX)
  amount!: number;
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
  /**
   * Single-mode payment for the full bill. Ignored when `payments` is sent (the stored
   * method is then derived from the legs: one leg's method, or SPLIT).
   */
  @ValidateIf((o: CreatePosOrderDto) => o.payments == null)
  @IsEnum(PaymentMethodEnum)
  paymentMethod?: PaymentMethodEnum;

  /** Payment legs (1-3, one per method). Must reconcile with the server-priced total. */
  @IsOptional()
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(3)
  @ArrayUnique((l: PosPaymentLegDto) => l?.method, {
    message: 'each payment method may appear once',
  })
  @ValidateNested({ each: true })
  @Type(() => PosPaymentLegDto)
  payments?: PosPaymentLegDto[];

  /** Cash handed over by the customer; must be >= the cash leg. Change = tendered - cash leg. */
  @IsOptional()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2, allowNaN: false, allowInfinity: false })
  @Min(0.01)
  @Max(BILL_TOTAL_MAX)
  cashTendered?: number;

  @IsOptional()
  @IsString()
  @MaxLength(CUSTOMER_NAME_MAX_LENGTH, {
    message: `customerName must be at most ${CUSTOMER_NAME_MAX_LENGTH} characters`,
  })
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
  @Matches(GSTIN_OR_EMPTY, { message: GSTIN_MESSAGE })
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
