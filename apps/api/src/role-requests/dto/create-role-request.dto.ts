import { RoleRequestKind, UserRole } from '@prisma/client';
import { IsEnum, IsObject, IsOptional, ValidateIf } from 'class-validator';

export class CreateRoleRequestDto {
  @IsEnum(RoleRequestKind)
  kind!: RoleRequestKind;

  @ValidateIf((o: CreateRoleRequestDto) => o.kind === RoleRequestKind.ROLE_CHANGE)
  @IsEnum(UserRole)
  requestedRole?: UserRole;

  @ValidateIf((o: CreateRoleRequestDto) => o.kind === RoleRequestKind.PERMISSION_EXTENSION)
  @IsOptional()
  @IsObject()
  requestedPermissions?: Record<string, unknown>;
}
