import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import type { Shop, User } from '@prisma/client';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma.service';

type UserWithShop = User & { shop: Shop };

const JWT_USER_CACHE_TTL_MS = (() => {
  const n = parseInt(process.env.JWT_USER_CACHE_TTL_MS ?? '', 10);
  if (Number.isFinite(n) && n >= 3_000 && n <= 300_000) return n;
  return 15_000;
})();
const JWT_USER_CACHE_MAX = 500;
const jwtUserCache = new Map<
  string,
  { user: UserWithShop; storedAt: number }
>();

function getCachedUser(id: string): UserWithShop | undefined {
  const row = jwtUserCache.get(id);
  if (!row) return undefined;
  if (Date.now() - row.storedAt > JWT_USER_CACHE_TTL_MS) {
    jwtUserCache.delete(id);
    return undefined;
  }
  return row.user;
}

function setCachedUser(id: string, user: UserWithShop) {
  if (jwtUserCache.size >= JWT_USER_CACHE_MAX) {
    const first = jwtUserCache.keys().next().value;
    if (first !== undefined) jwtUserCache.delete(first);
  }
  jwtUserCache.set(id, { user, storedAt: Date.now() });
}

/** Call after mutating a user so the next request reloads role / permissionOverrides. */
export function invalidateJwtUserCache(userId: string) {
  jwtUserCache.delete(userId);
}

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    private readonly jwt: JwtService,
    private readonly prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest();
    const auth = req.headers.authorization as string | undefined;
    if (!auth?.startsWith('Bearer ')) {
      throw new UnauthorizedException('Missing bearer token');
    }
    const token = auth.slice(7);
    try {
      const payload = await this.jwt.verifyAsync<{ sub: string }>(token);
      let user = getCachedUser(payload.sub);
      if (!user) {
        const fetched = await this.prisma.user.findUnique({
          where: { id: payload.sub },
          include: { shop: true },
        });
        if (!fetched?.isActive) {
          throw new UnauthorizedException('User inactive');
        }
        user = fetched as UserWithShop;
        setCachedUser(payload.sub, user);
      } else if (!user.isActive) {
        jwtUserCache.delete(payload.sub);
        throw new UnauthorizedException('User inactive');
      }
      req.user = user;
      return true;
    } catch (e) {
      if (e instanceof UnauthorizedException) throw e;
      throw new UnauthorizedException('Invalid or expired token');
    }
  }
}
