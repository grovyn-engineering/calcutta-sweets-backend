import { SetMetadata } from '@nestjs/common';
import type { RolePermissions } from '../settings/effective-permissions';

export const PERMISSION_KEY = 'requiredPermission';

export const ANY_PERMISSIONS_KEY = 'anyPermissions';

export type PermissionKey = keyof RolePermissions;

export const RequirePermission = (permission: PermissionKey) =>
  SetMetadata(PERMISSION_KEY, permission);

/** User must have at least one of these flags (e.g. inventory or billing for POS reads). */
export const RequireAnyPermission = (...permissions: PermissionKey[]) =>
  SetMetadata(ANY_PERMISSIONS_KEY, permissions);
