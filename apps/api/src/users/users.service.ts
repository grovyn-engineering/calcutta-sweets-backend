import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { invalidateJwtUserCache } from '../auth/jwt-auth.guard';
import { PrismaService } from '../prisma.service';
import { ROLE_PERMISSION_FIELD_KEYS } from '../settings/effective-permissions';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';

import { EmailService } from '../email/email.service';
import {
  assertIndianMobile10,
  normalizeIndianMobile,
} from '../common/indian-mobile';
import * as bcrypt from 'bcrypt';

const SALT_ROUNDS = 10;

@Injectable()
export class UsersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly emailService: EmailService,
  ) {}

  async findPage(shopCode: string, page: number, size: number) {
    if (!shopCode) {
      throw new BadRequestException('shopCode is required');
    }
    const skip = (page - 1) * size;
    const where = { shopCode };

    const [total, rows] = await Promise.all([
      this.prisma.user.count({ where }),
      this.prisma.user.findMany({
        where,
        skip,
        take: size,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          shopCode: true,
          isActive: true,
          createdAt: true,
          updatedAt: true,
        },
      }),
    ]);

    const last_page = Math.max(1, Math.ceil(total / size) || 1);
    return { data: rows, last_page };
  }

  async create(dto: CreateUserDto) {
    const email = dto.email.toLowerCase().trim();
    const existing = await this.prisma.user.findUnique({ where: { email } });
    if (existing) {
      throw new ConflictException('Email already registered');
    }
    const shop = await this.prisma.shop.findUnique({
      where: { shopCode: dto.shopCode },
    });
    if (!shop) {
      throw new BadRequestException(`Shop ${dto.shopCode} not found`);
    }

    const hashedPassword = await bcrypt.hash(dto.password, SALT_ROUNDS);
    const user = await this.prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name: dto.name ?? null,
        shopCode: dto.shopCode,
        role: dto.role,
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        shopCode: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    // Send welcome email asynchronously
    this.emailService
      .sendWelcomeEmail(
        user.email,
        user.name || '',
        user.role,
        shop.name,
        dto.password,
      )
      .catch((err) => {
        console.error(`Failed to send welcome email to ${user.email}:`, err);
      });

    return user;
  }

  assertActorCanRemoveUser(actorRole: UserRole, targetRole: UserRole) {
    if (actorRole === UserRole.SUPER_ADMIN) {
      return;
    }
    if (targetRole === UserRole.SUPER_ADMIN) {
      throw new ForbiddenException('You cannot remove a super admin');
    }
    if (actorRole === UserRole.ADMIN) {
      if (targetRole === UserRole.ADMIN) {
        throw new ForbiddenException('Admins cannot remove other admins');
      }
      return;
    }
    if (actorRole === UserRole.MANAGER) {
      if (
        targetRole === UserRole.MANAGER ||
        targetRole === UserRole.ADMIN
      ) {
        throw new ForbiddenException('You do not have permission to remove this user');
      }
      return;
    }
    throw new ForbiddenException('You do not have permission to remove users');
  }

  async remove(
    id: string,
    scopeShopCode: string,
    actor: { id: string; role: UserRole },
  ) {
    if (id === actor.id) {
      throw new BadRequestException('You cannot delete your own account');
    }
    const target = await this.findOneForShop(id, scopeShopCode);
    this.assertActorCanRemoveUser(actor.role, target.role);

    await this.prisma.$transaction(async (tx) => {
      await tx.order.updateMany({
        where: { createdById: id },
        data: { createdById: null },
      });
      await tx.roleRequest.deleteMany({ where: { userId: id } });
      await tx.user.delete({ where: { id } });
    });

    invalidateJwtUserCache(id);
  }

  async update(id: string, dto: UpdateUserDto, scopeShopCode: string) {
    await this.findOneForShop(id, scopeShopCode);

    if (dto.shopCode) {
      const shop = await this.prisma.shop.findUnique({
        where: { shopCode: dto.shopCode },
      });
      if (!shop) {
        throw new BadRequestException(`Shop ${dto.shopCode} not found`);
      }
    }

    const data: Record<string, unknown> = {};
    if (dto.name !== undefined) data.name = dto.name;
    if (dto.password !== undefined) {
      data.password = await bcrypt.hash(dto.password, SALT_ROUNDS);
    }
    if (dto.shopCode !== undefined) data.shopCode = dto.shopCode;
    if (dto.role !== undefined) data.role = dto.role;
    if (dto.isActive !== undefined) data.isActive = dto.isActive;
    if (dto.permissionOverrides !== undefined) {
      if (dto.permissionOverrides === null) {
        data.permissionOverrides = null;
      } else if (
        typeof dto.permissionOverrides === 'object' &&
        !Array.isArray(dto.permissionOverrides)
      ) {
        const cleaned: Record<string, boolean> = {};
        for (const k of ROLE_PERMISSION_FIELD_KEYS) {
          const v = (dto.permissionOverrides as Record<string, unknown>)[k];
          if (typeof v === 'boolean') cleaned[k] = v;
        }
        data.permissionOverrides =
          Object.keys(cleaned).length > 0 ? cleaned : null;
      } else {
        throw new BadRequestException('permissionOverrides must be an object or null');
      }
    }

    const updated = await this.prisma.user.update({
      where: { id },
      data: data as any,
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        shopCode: true,
        isActive: true,
        permissionOverrides: true,
        createdAt: true,
        updatedAt: true,
      },
    });
    invalidateJwtUserCache(id);
    return updated;
  }

  async findOneForShop(id: string, shopCode: string) {
    const user = await this.prisma.user.findFirst({
      where: { id, shopCode },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        shopCode: true,
        isActive: true,
        permissionOverrides: true,
        createdAt: true,
        updatedAt: true,
      },
    });
    if (!user) {
      throw new NotFoundException(`User #${id} not found`);
    }
    return user;
  }

  async findOne(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: {
        id: true, email: true, name: true, role: true, shopCode: true,
        isActive: true, avatarUrl: true, phone: true, createdAt: true, updatedAt: true,
      },
    });
    if (!user) {
      throw new NotFoundException(`User not found`);
    }
    return user;
  }

  async updateProfile(id: string, dto: { name?: string; avatarUrl?: string; phone?: string }) {
    const phonePatch =
      dto.phone === undefined
        ? {}
        : (() => {
            const d = normalizeIndianMobile(dto.phone);
            if (d === '') return { phone: null as string | null };
            assertIndianMobile10(d);
            return { phone: d };
          })();

    return this.prisma.user.update({
      where: { id },
      data: {
        ...(dto.name !== undefined && { name: dto.name }),
        ...(dto.avatarUrl !== undefined && { avatarUrl: dto.avatarUrl }),
        ...phonePatch,
      },
      select: {
        id: true, email: true, name: true, role: true, shopCode: true,
        isActive: true, avatarUrl: true, phone: true, createdAt: true, updatedAt: true,
      },
    });
  }
}
