import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsNumber,
  Max,
  IsOptional,
  IsString,
  MaxLength,
  Min,
  Matches,
} from 'class-validator';
import {
  GSTIN_MESSAGE,
  GSTIN_OR_EMPTY,
  PINCODE_OR_EMPTY,
} from '../../common/gstin';

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
  @Matches(PINCODE_OR_EMPTY, { message: 'PIN code must be 6 digits' })
  pincode?: string;

  @IsOptional()
  @IsString()
  @Matches(GSTIN_OR_EMPTY, { message: GSTIN_MESSAGE })
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
  @IsBoolean()
  allowShopSwitcher?: boolean;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @Max(20)
  cgstRate?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @Max(20)
  sgstRate?: number;
}
