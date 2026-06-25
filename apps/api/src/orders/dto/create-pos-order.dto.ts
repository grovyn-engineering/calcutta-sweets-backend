import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsDateString,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  Min,
  ValidateNested,
} from 'class-validator';

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
  @IsNumber()
  @Min(0.000001)
  quantity!: number;

  @Type(() => Number)
  @IsNumber()
  @Min(0)
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

  @IsOptional()
  @IsNumber()
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
