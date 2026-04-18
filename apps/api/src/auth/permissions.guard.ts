import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { User } from '@prisma/client';
import { mergeEffectivePermissions } from '../settings/effective-permissions';
import {
  ANY_PERMISSIONS_KEY,
  PERMISSION_KEY,
  type PermissionKey,
} from './permissions.decorator';

@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest();
    const user = req.user as User | undefined;
    if (!user) {
      throw new ForbiddenException();
    }
    const effective = mergeEffectivePermissions(
      user.role,
      user.permissionOverrides,
    );

    const anyPermissions = this.reflector.getAllAndOverride<PermissionKey[]>(
      ANY_PERMISSIONS_KEY,
      [context.getHandler(), context.getClass()],
    );
    if (anyPermissions?.length) {
      const ok = anyPermissions.some((k) => effective[k]);
      if (!ok) {
        throw new ForbiddenException(
          'You do not have permission for this resource',
        );
      }
      return true;
    }

    const permission = this.reflector.getAllAndOverride<PermissionKey>(
      PERMISSION_KEY,
      [context.getHandler(), context.getClass()],
    );
    if (!permission) {
      return true;
    }
    if (!effective[permission]) {
      throw new ForbiddenException(
        'You do not have permission for this resource',
      );
    }
    return true;
  }
}
