import { Type } from 'class-transformer';
import { IsNumber, IsOptional, IsString } from 'class-validator';

export class UpdateShopDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  address?: string;

  @IsOptional()
  @IsString()
  shopCode?: string;

  @IsOptional()
  @IsString()
  logoUrl?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  cgstRate?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  sgstRate?: number;
}
