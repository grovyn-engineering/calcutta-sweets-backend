import { ForbiddenException } from '@nestjs/common';
import { UserRole } from '@prisma/client';

/** Roles that may change prices and stock levels (cashiers and staff may edit names etc.). */
const MANAGER_AND_ABOVE: UserRole[] = [
  UserRole.SUPER_ADMIN,
  UserRole.ADMIN,
  UserRole.MANAGER,
];

/**
 * Rejects the request when a role below manager would change any value marked true in
 * `changes` (label → changed?). Unchanged values are fine, since edit forms resend them.
 */
export function assertManagerForChanges(
  role: UserRole | undefined,
  changes: Record<string, boolean>,
): void {
  if (role && MANAGER_AND_ABOVE.includes(role)) return;
  const changed = Object.keys(changes).filter((label) => changes[label]);
  if (changed.length > 0) {
    throw new ForbiddenException(
      `Only a manager or admin can change ${changed.join(', ')}`,
    );
  }
}
