import {
  BadRequestException,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { UserRole } from '@prisma/client';
import type { User } from '@prisma/client';
import type { Request } from 'express';

/**
 * After JWT: fills `req.effectiveShopCode` from X-Shop for super admins, otherwise the user's shop.
 */
@Injectable()
export class ShopScopeGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest<Request>();
    const user = req.user;
    if (!user) {
      throw new UnauthorizedException();
    }

    const raw = req.headers['x-shop'];
    const headerShop =
      typeof raw === 'string'
        ? raw.trim()
        : Array.isArray(raw)
          ? (raw[0]?.trim() ?? '')
          : '';

    const queryShop = String(
      (req.query as { shopCode?: string })?.shopCode ?? '',
    ).trim();

    if (user.role === UserRole.SUPER_ADMIN) {
      // The dashboard sends X-Shop (the active shop) on every call, so an explicit
      // ?shopCode= is a deliberate override, e.g. viewing another shop's stock from /shops.
      req.effectiveShopCode = queryShop || headerShop || user.shopCode || '';
      if (!req.effectiveShopCode) {
        throw new BadRequestException(
          'Missing shop context: send X-Shop header or ensure your account has a shop',
        );
      }
    } else {
      if (headerShop && headerShop !== user.shopCode) {
        throw new ForbiddenException(
          'X-Shop does not match your assigned shop',
        );
      }
      req.effectiveShopCode = user.shopCode;
    }

    return true;
  }
}
