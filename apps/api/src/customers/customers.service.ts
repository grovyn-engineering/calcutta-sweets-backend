import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma, UserRole } from '@calcutta/database';
import { PrismaService } from '../prisma.service';
import { customerSearchWhere } from '../common/customer-search';
import {
  assertIndianMobile10,
  normalizeIndianMobile,
} from '../common/indian-mobile';
import { UpdateCustomerDto } from './dto/update-customer.dto';

/** Roles allowed to change a saved customer's phone (it is the per-shop identity key). */
export const CUSTOMER_PHONE_EDIT_ROLES: readonly UserRole[] = [
  UserRole.SUPER_ADMIN,
  UserRole.ADMIN,
  UserRole.MANAGER,
];

const customerSelect = {
  id: true,
  name: true,
  phone: true,
  email: true,
  address: true,
  notes: true,
  gstin: true,
} satisfies Prisma.CustomerSelect;

const SEARCH_LIMIT_MAX = 50;

@Injectable()
export class CustomersService {
  constructor(private readonly prisma: PrismaService) {}

  search(shopCode: string, q: string | undefined, limit = 20) {
    return this.prisma.customer.findMany({
      where: customerSearchWhere(shopCode, q),
      orderBy: { updatedAt: 'desc' },
      take: Math.min(SEARCH_LIMIT_MAX, Math.max(1, limit)),
      select: customerSelect,
    });
  }

  async update(
    shopCode: string,
    id: string,
    role: UserRole | undefined,
    dto: UpdateCustomerDto,
  ) {
    const existing = await this.prisma.customer.findFirst({
      where: { id, shopCode },
      select: { id: true, phone: true },
    });
    if (!existing) throw new NotFoundException('Customer not found');

    const data: Prisma.CustomerUpdateInput = {};
    if (dto.name !== undefined) {
      const name = dto.name.trim();
      if (!name) throw new BadRequestException('Name cannot be empty');
      data.name = name;
    }
    const optional = (v: string | undefined) =>
      v === undefined ? undefined : v.trim() || null;
    data.email = optional(dto.email);
    data.address = optional(dto.address);
    data.notes = optional(dto.notes);
    const gstin = optional(dto.gstin);
    data.gstin = gstin ? gstin.toUpperCase() : gstin;

    if (dto.phone !== undefined) {
      const phone = normalizeIndianMobile(dto.phone);
      if (phone !== existing.phone) {
        if (!role || !CUSTOMER_PHONE_EDIT_ROLES.includes(role)) {
          throw new ForbiddenException(
            "Only a manager or admin can change a customer's phone number",
          );
        }
        assertIndianMobile10(phone);
        data.phone = phone;
      }
    }

    try {
      return await this.prisma.customer.update({
        where: { id: existing.id },
        data,
        select: customerSelect,
      });
    } catch (e) {
      if (
        e instanceof Prisma.PrismaClientKnownRequestError &&
        e.code === 'P2002'
      ) {
        throw new ConflictException(
          'Another customer in this shop already uses that phone number',
        );
      }
      throw e;
    }
  }
}
