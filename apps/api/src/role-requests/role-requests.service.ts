import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma, RoleRequestKind, RequestStatus, UserRole } from '@prisma/client';
import type { RolePermissions } from '../settings/effective-permissions';
import { invalidateJwtUserCache } from '../auth/jwt-auth.guard';
import { PrismaService } from '../prisma.service';
import { EmailService } from '../email/email.service';
import {
  ROLE_PERMISSION_FIELD_KEYS,
  getPermissionsForRole,
  mergeEffectivePermissions,
} from '../settings/effective-permissions';
import type { CreateRoleRequestDto } from './dto/create-role-request.dto';

@Injectable()
export class RoleRequestsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly emailService: EmailService,
  ) {}

  private normalizePermissionPatch(
    raw: Record<string, unknown> | undefined,
  ): Record<string, boolean> {
    if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
      return {};
    }
    const out: Record<string, boolean> = {};
    for (const k of ROLE_PERMISSION_FIELD_KEYS) {
      if (raw[k] === true) {
        out[k] = true;
      }
    }
    return out;
  }

  private overridesFromEffective(
    role: UserRole,
    effective: RolePermissions,
  ): Record<string, boolean> | null {
    const defaults = getPermissionsForRole(role);
    const diff: Record<string, boolean> = {};
    for (const k of ROLE_PERMISSION_FIELD_KEYS) {
      if (effective[k] !== defaults[k]) {
        diff[k] = effective[k];
      }
    }
    return Object.keys(diff).length > 0 ? diff : null;
  }

  async create(userId: string, shopCode: string, dto: CreateRoleRequestDto) {
    const existing = await this.prisma.roleRequest.findFirst({
      where: { userId, status: RequestStatus.PENDING },
    });
    if (existing) {
      throw new BadRequestException('You already have a pending access request');
    }

    if (dto.kind === RoleRequestKind.ROLE_CHANGE) {
      if (!dto.requestedRole) {
        throw new BadRequestException('requestedRole is required for a role change');
      }
      return this.prisma.roleRequest.create({
        data: {
          userId,
          shopCode,
          kind: RoleRequestKind.ROLE_CHANGE,
          requestedRole: dto.requestedRole,
          requestedPermissions: undefined,
          status: RequestStatus.PENDING,
        },
      });
    }

    const patch = this.normalizePermissionPatch(
      dto.requestedPermissions as Record<string, unknown> | undefined,
    );
    if (Object.keys(patch).length === 0) {
      throw new BadRequestException(
        'Select at least one permission to request',
      );
    }

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });
    if (!user) {
      throw new BadRequestException('User not found');
    }

    const effective = mergeEffectivePermissions(
      user.role,
      user.permissionOverrides,
    );
    for (const k of Object.keys(patch) as (keyof RolePermissions)[]) {
      if (effective[k]) {
        throw new BadRequestException(
          `You already have “${k.replace(/^canAccess/, '').replace(/([A-Z])/g, ' $1').trim()}” access`,
        );
      }
    }

    return this.prisma.roleRequest.create({
      data: {
        userId,
        shopCode,
        kind: RoleRequestKind.PERMISSION_EXTENSION,
        requestedRole: null,
        requestedPermissions: patch,
        status: RequestStatus.PENDING,
      },
    });
  }

  async findAll(shopCode?: string) {
    return this.prisma.roleRequest.findMany({
      where: shopCode ? { shopCode, status: RequestStatus.PENDING } : { status: RequestStatus.PENDING },
      include: {
        user: { select: { name: true, email: true, role: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async approve(id: string) {
    const request = await this.prisma.roleRequest.findUnique({
      where: { id },
      include: { user: true },
    });
    if (!request) throw new NotFoundException('Role request not found');
    if (request.status !== RequestStatus.PENDING) {
      throw new BadRequestException('Request is not pending');
    }

    if (request.kind === RoleRequestKind.ROLE_CHANGE) {
      if (!request.requestedRole) {
        throw new BadRequestException('Invalid role request');
      }
      await this.prisma.$transaction([
        this.prisma.roleRequest.update({
          where: { id },
          data: { status: RequestStatus.APPROVED },
        }),
        this.prisma.user.update({
          where: { id: request.userId },
          data: { role: request.requestedRole },
        }),
      ]);
      invalidateJwtUserCache(request.userId);
      await this.emailService.sendRoleRequestEmail(
        request.user.email,
        request.requestedRole,
        'APPROVED',
      );
      return { message: 'Approved successfully' };
    }

    const patch =
      request.requestedPermissions &&
      typeof request.requestedPermissions === 'object' &&
      !Array.isArray(request.requestedPermissions)
        ? this.normalizePermissionPatch(
            request.requestedPermissions as Record<string, unknown>,
          )
        : {};
    if (Object.keys(patch).length === 0) {
      throw new BadRequestException('Invalid permission request payload');
    }

    const user = request.user;
    const currentEffective = mergeEffectivePermissions(
      user.role,
      user.permissionOverrides,
    );
    const nextEffective = { ...currentEffective };
    for (const k of Object.keys(patch) as (keyof RolePermissions)[]) {
      if (patch[k]) {
        nextEffective[k] = true;
      }
    }
    const newOverrides = this.overridesFromEffective(user.role, nextEffective);

    await this.prisma.$transaction([
      this.prisma.roleRequest.update({
        where: { id },
        data: { status: RequestStatus.APPROVED },
      }),
      this.prisma.user.update({
        where: { id: request.userId },
        data: {
          permissionOverrides:
            newOverrides === null
              ? Prisma.DbNull
              : (newOverrides as Prisma.InputJsonValue),
        },
      }),
    ]);
    invalidateJwtUserCache(request.userId);

    const summary = Object.keys(patch)
      .map((k) => k.replace(/^canAccess/, '').replace(/([A-Z])/g, ' $1').trim())
      .join(', ');
    await this.emailService.sendPermissionRequestEmail(
      request.user.email,
      summary,
      'APPROVED',
    );
    return { message: 'Approved successfully' };
  }

  async reject(id: string) {
    const request = await this.prisma.roleRequest.findUnique({
      where: { id },
      include: { user: true },
    });
    if (!request) throw new NotFoundException('Role request not found');
    if (request.status !== RequestStatus.PENDING) {
      throw new BadRequestException('Request is not pending');
    }

    await this.prisma.roleRequest.update({
      where: { id },
      data: { status: RequestStatus.REJECTED },
    });

    if (request.kind === RoleRequestKind.ROLE_CHANGE && request.requestedRole) {
      await this.emailService.sendRoleRequestEmail(
        request.user.email,
        request.requestedRole,
        'REJECTED',
      );
    } else {
      const patch =
        request.requestedPermissions &&
        typeof request.requestedPermissions === 'object' &&
        !Array.isArray(request.requestedPermissions)
          ? this.normalizePermissionPatch(
              request.requestedPermissions as Record<string, unknown>,
            )
          : {};
      const summary =
        Object.keys(patch).length > 0
          ? Object.keys(patch)
              .map((k) =>
                k.replace(/^canAccess/, '').replace(/([A-Z])/g, ' $1').trim(),
              )
              .join(', ')
          : 'additional access';
      await this.emailService.sendPermissionRequestEmail(
        request.user.email,
        summary,
        'REJECTED',
      );
    }
    return { message: 'Rejected successfully' };
  }
}
