import { UserRole } from '@prisma/client';
import {
  Allow,
  IsBoolean,
  IsEnum,
  IsOptional,
  IsString,
  MinLength,
} from 'class-validator';

export class UpdateUserDto {
  @IsOptional()
  @IsString()
  name?: string | null;

  @IsOptional()
  @IsString()
  @MinLength(6)
  password?: string;

  @IsOptional()
  @IsString()
  shopCode?: string;

  @IsOptional()
  @IsEnum(UserRole)
  role?: UserRole;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  /** Partial permission flags; merged with role defaults. Send `null` to clear overrides. */
  @IsOptional()
  @Allow()
  permissionOverrides?: Record<string, boolean> | null;
}
