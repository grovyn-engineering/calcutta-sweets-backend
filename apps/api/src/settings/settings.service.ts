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
}
