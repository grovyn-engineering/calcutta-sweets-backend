import { Injectable } from '@nestjs/common';
import { UserRole } from '@prisma/client';
import {
  type RolePermissions,
  getPermissionsForRole,
  mergeEffectivePermissions,
  ROLE_PERMISSION_FIELD_KEYS,
} from './effective-permissions';

export type { RolePermissions };
export { ROLE_PERMISSION_FIELD_KEYS };

@Injectable()
export class SettingsService {
  getPermissionsForRole(role: UserRole): RolePermissions {
    return getPermissionsForRole(role);
  }

  mergeEffectivePermissions(
    role: UserRole,
    overrides: unknown,
  ): RolePermissions {
    return mergeEffectivePermissions(role, overrides);
  }
}
