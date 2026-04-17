import { Injectable } from '@nestjs/common';
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

@Injectable()
export class SettingsService {
    getPermissionsForRole(role: UserRole): RolePermissions {
        const isSuperAdmin = role === 'SUPER_ADMIN';
        const isAdmin = role === 'ADMIN';
        const isManager = role === 'MANAGER';
        const isCashier = role === 'CASHIER';
        const isStaff = role === 'STAFF';

        const isAtLeastStaff = isSuperAdmin || isAdmin || isManager || isCashier || isStaff;
        const isAtLeastAdmin = isSuperAdmin || isAdmin;

        return {
            canAccessDashboard: true, // Everyone gets access
            canAccessBilling: isAtLeastStaff,
            canAccessOrders: isAtLeastStaff,
            canAccessProducts: isAtLeastStaff,
            canAccessInventory: isAtLeastStaff,
            canAccessCategories: isAtLeastStaff,
            canAccessReports: isAtLeastAdmin,
            canAccessUsers: isSuperAdmin,
            canAccessSettings: true, // Everyone gets access
        };
    }

    /** Merges optional JSON overrides from `User.permissionOverrides` onto role defaults. */
    mergeEffectivePermissions(
        role: UserRole,
        overrides: unknown,
    ): RolePermissions {
        const base = this.getPermissionsForRole(role);
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
}
