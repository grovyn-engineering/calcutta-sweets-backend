import { Type } from 'class-transformer';
import { IsNumber, IsOptional, IsString } from 'class-validator';

export class CreateShopDto {
  @IsString()
  name: string;

  @IsString()
  shopCode: string;

  @IsOptional()
  @IsString()
  address?: string;

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
