/**
 * Longest customer name accepted anywhere (customer form, Raw bill, API). Keeps the
 * name to at most two lines on an 80 mm receipt. Mirrors CUSTOMER_NAME_MAX_LENGTH in
 * apps/api/src/common/customer.ts.
 */
export const CUSTOMER_NAME_MAX_LENGTH = 60;

/**
 * Roles that may change a saved customer's phone (the per-shop identity key). Mirrors
 * CUSTOMER_PHONE_EDIT_ROLES in apps/api/src/customers/customers.service.ts.
 */
export const CUSTOMER_PHONE_EDIT_ROLES: readonly string[] = [
  "SUPER_ADMIN",
  "ADMIN",
  "MANAGER",
];
