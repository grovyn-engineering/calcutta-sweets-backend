import type { RolePermissions } from "@/contexts/AuthContext";

/** Role options shown in dashboard user forms (matches product direction). */
export const ROLE_FORM_OPTIONS = [
  { value: "SUPER_ADMIN", label: "Super Admin" },
  { value: "MANAGER", label: "Manager" },
  { value: "STAFF", label: "Staff" },
] as const;

export const PERMISSION_ROWS: { key: keyof RolePermissions; label: string }[] = [
  { key: "canAccessDashboard", label: "Dashboard" },
  { key: "canAccessBilling", label: "Billing POS" },
  { key: "canAccessOrders", label: "Orders" },
  { key: "canAccessProducts", label: "Products" },
  { key: "canAccessInventory", label: "Inventory" },
  { key: "canAccessCategories", label: "Categories" },
  { key: "canAccessReports", label: "Reports & analytics" },
  { key: "canAccessUsers", label: "Users & access" },
  { key: "canAccessSettings", label: "Settings" },
];

export const ROLE_PERMISSION_FIELD_KEYS = PERMISSION_ROWS.map(
  (r) => r.key,
) as (keyof RolePermissions)[];

/** Mirrors `apps/api/src/settings/settings.service.ts` `getPermissionsForRole`. */
export function getPermissionsForRole(role: string): RolePermissions {
  const isSuperAdmin = role === "SUPER_ADMIN";
  const isAdmin = role === "ADMIN";
  const isManager = role === "MANAGER";
  const isCashier = role === "CASHIER";
  const isStaff = role === "STAFF";

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
    canAccessUsers: isSuperAdmin || isAdmin,
    canAccessSettings: true,
  };
}

export function mergeEffectivePermissions(
  role: string,
  overrides: unknown,
): RolePermissions {
  const base = getPermissionsForRole(role);
  if (!overrides || typeof overrides !== "object" || Array.isArray(overrides)) {
    return base;
  }
  const o = overrides as Record<string, unknown>;
  const out = { ...base };
  for (const k of ROLE_PERMISSION_FIELD_KEYS) {
    if (typeof o[k] === "boolean") {
      (out as Record<string, boolean>)[k] = o[k] as boolean;
    }
  }
  return out;
}

/** Partial overrides to persist (only keys that differ from role defaults). */
export function computeOverridesFromDraft(
  role: string,
  draft: RolePermissions,
): Record<string, boolean> | null {
  const defaults = getPermissionsForRole(role);
  const diff: Record<string, boolean> = {};
  for (const k of ROLE_PERMISSION_FIELD_KEYS) {
    if (draft[k] !== defaults[k]) diff[k] = draft[k];
  }
  return Object.keys(diff).length > 0 ? diff : null;
}
