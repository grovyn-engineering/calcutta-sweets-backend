import {
  IsString,
  IsOptional,
  IsArray,
  ValidateNested,
  IsNumber,
  Max,
  Min,
  ArrayMinSize,
  ArrayMaxSize,
} from 'class-validator';
import { Type } from 'class-transformer';

export class TransferItemDto {
  @IsString()
  barcode: string;

  @IsString()
  productName: string;

  @IsString()
  variantName: string;

  /** Inventory units; fractional for KG items (e.g. 0.5). */
  @IsNumber()
  @Min(0.001)
  @Max(100_000)
  quantity: number;
}

export class CreateTransferDto {
  @IsOptional()
  @IsString()
  note?: string;

  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(200)
  @ValidateNested({ each: true })
  @Type(() => TransferItemDto)
  items: TransferItemDto[];
}
