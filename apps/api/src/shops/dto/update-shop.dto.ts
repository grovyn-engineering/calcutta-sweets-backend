import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';

/** Patch payload for Shop. Super admins may set all fields; other roles may only update CGST/SGST. */
export class UpdateShopDto {
  @IsOptional()
  @IsString()
  @MaxLength(200)
  name?: string;

  @IsOptional()
  @IsString()
  address?: string;

  @IsOptional()
  @IsString()
  logoUrl?: string;

  @IsOptional()
  @IsString()
  email?: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsString()
  city?: string;

  @IsOptional()
  @IsString()
  state?: string;

  @IsOptional()
  @IsString()
  country?: string;

  @IsOptional()
  @IsString()
  pincode?: string;

  @IsOptional()
  @IsString()
  gstNumber?: string;

  @IsOptional()
  @IsString()
  fssaiNumber?: string;

  @IsOptional()
  @IsString()
  @MaxLength(8)
  currency?: string;

  @IsOptional()
  @IsString()
  upiId?: string;

  @IsOptional()
  @IsString()
  bankName?: string;

  @IsOptional()
  @IsString()
  bankAccountNumber?: string;

  @IsOptional()
  @IsString()
  bankIfsc?: string;

  @IsOptional()
  @IsBoolean()
  isFactory?: boolean;

  @IsOptional()
  @IsBoolean()
  allowNextDayBooking?: boolean;

  @IsOptional()
  @IsBoolean()
  allowBookingWhenOutOfStock?: boolean;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  cgstRate?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  sgstRate?: number;
}
