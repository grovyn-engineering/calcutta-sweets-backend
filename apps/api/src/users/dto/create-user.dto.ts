import { UserRole } from '@prisma/client';
import {
  Allow,
  IsEmail,
  IsEnum,
  IsOptional,
  IsString,
  MinLength,
} from 'class-validator';

export class CreateUserDto {
  @IsEmail()
  email!: string;

  @IsString()
  @MinLength(6)
  password!: string;

  @IsOptional()
  @IsString()
  name?: string;

  @IsString()
  shopCode!: string;

  @IsEnum(UserRole)
  role!: UserRole;

  /** Per-user toggles on top of the role defaults; unknown keys are dropped. */
  @IsOptional()
  @Allow()
  permissionOverrides?: Record<string, boolean> | null;
}
