import { IsString, IsOptional, IsArray, ValidateNested, IsInt, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class TransferItemDto {
  @IsString()
  barcode: string;

  @IsString()
  productName: string;

  @IsString()
  variantName: string;

  @IsInt()
  @Min(1)
  quantity: number;
}

export class CreateTransferDto {
  @IsOptional()
  @IsString()
  note?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => TransferItemDto)
  items: TransferItemDto[];
}
