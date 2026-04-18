import { UserRole } from '@prisma/client';

export interface RolePermissions {
  canAccessDashboard: boolean;
  canAccessBilling: boolean;
  canAccessOrders: boolean;
  canAccessProducts: boolean;
  canAccessInventory: boolean;
  canAccessCategories: boolean;
  canAccessReports: boolean;
  canAccessUsers: boolean;
  canAccessSettings: boolean;
}

export const ROLE_PERMISSION_FIELD_KEYS: (keyof RolePermissions)[] = [
  'canAccessDashboard',
  'canAccessBilling',
  'canAccessOrders',
  'canAccessProducts',
  'canAccessInventory',
  'canAccessCategories',
  'canAccessReports',
  'canAccessUsers',
  'canAccessSettings',
];

export function getPermissionsForRole(role: UserRole): RolePermissions {
  const isSuperAdmin = role === UserRole.SUPER_ADMIN;
  const isAdmin = role === UserRole.ADMIN;
  const isManager = role === UserRole.MANAGER;
  const isCashier = role === UserRole.CASHIER;
  const isStaff = role === UserRole.STAFF;

  const isAtLeastStaff =
    isSuperAdmin || isAdmin || isManager || isCashier || isStaff;
  const isAtLeastAdmin = isSuperAdmin || isAdmin;

  return {
    canAccessDashboard: true,
    canAccessBilling: isAtLeastStaff,
    canAccessOrders: isAtLeastStaff,
    canAccessProducts: isAtLeastStaff,
    canAccessInventory: isAtLeastStaff,
    canAccessCategories: isAtLeastStaff,
    canAccessReports: isAtLeastAdmin,
    /** Matches dashboard nav: Users is limited to super admin + admin in the UI. */
    canAccessUsers: isSuperAdmin || isAdmin,
    canAccessSettings: true,
  };
}

/** Merges optional JSON overrides from `User.permissionOverrides` onto role defaults. */
export function mergeEffectivePermissions(
  role: UserRole,
  overrides: unknown,
): RolePermissions {
  const base = getPermissionsForRole(role);
  if (!overrides || typeof overrides !== 'object' || Array.isArray(overrides)) {
    return base;
  }
  const o = overrides as Record<string, unknown>;
  const out = { ...base };
  for (const k of ROLE_PERMISSION_FIELD_KEYS) {
    if (typeof o[k] === 'boolean') {
      (out as Record<string, boolean>)[k] = o[k] as boolean;
    }
  }
  return out;
}
