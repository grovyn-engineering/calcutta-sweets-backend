import type { User } from '@prisma/client';

declare global {
  namespace Express {
    interface Request {
      user?: User;
      /** Set by ShopScopeGuard after JwtAuthGuard (shop context from X-Shop + role rules). */
      effectiveShopCode?: string;
    }
  }
}

export {};
