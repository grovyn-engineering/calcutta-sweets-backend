import { Type } from 'class-transformer';
import {
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Min,
  ValidateIf,
} from 'class-validator';

export class UpdateProductDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  price?: number;

  @IsOptional()
  @IsString()
  barcode?: string;

  @IsOptional()
  @IsString()
  shopCode?: string;

  /** Omit to leave unchanged; send null to clear the category. */
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
