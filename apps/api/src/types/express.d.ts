import type { User } from '@prisma/client';

declare global {
  namespace Express {
    interface Request {
      user?: User;
      /** Shop code resolved by ShopScopeGuard (header + role). */
      effectiveShopCode?: string;
    }
  }
}

export {};
