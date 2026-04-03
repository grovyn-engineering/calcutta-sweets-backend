import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { EmailService } from '../email/email.service';
import { UserRole, RequestStatus } from '@prisma/client';

@Injectable()
export class RoleRequestsService {
    constructor(
        private readonly prisma: PrismaService,
        private readonly emailService: EmailService,
    ) { }

    async create(userId: string, shopCode: string, requestedRole: UserRole) {
        const existing = await this.prisma.roleRequest.findFirst({
            where: { userId, status: 'PENDING' },
        });
        if (existing) throw new BadRequestException('You already have a pending role request');

        return this.prisma.roleRequest.create({
            data: { userId, shopCode, requestedRole, status: 'PENDING' },
        });
    }

    async findAll(shopCode?: string) {
        return this.prisma.roleRequest.findMany({
            where: shopCode ? { shopCode, status: 'PENDING' } : { status: 'PENDING' },
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
        if (request.status !== 'PENDING') throw new BadRequestException('Request is not pending');

        await this.prisma.$transaction([
            this.prisma.roleRequest.update({
                where: { id },
                data: { status: 'APPROVED' },
            }),
            this.prisma.user.update({
                where: { id: request.userId },
                data: { role: request.requestedRole },
            }),
        ]);

        await this.emailService.sendRoleRequestEmail(request.user.email, request.requestedRole, 'APPROVED');
        return { message: 'Approved successfully' };
    }

    async reject(id: string) {
        const request = await this.prisma.roleRequest.findUnique({
            where: { id },
            include: { user: true },
        });
        if (!request) throw new NotFoundException('Role request not found');
        if (request.status !== 'PENDING') throw new BadRequestException('Request is not pending');

        await this.prisma.roleRequest.update({
            where: { id },
            data: { status: 'REJECTED' },
        });

        await this.emailService.sendRoleRequestEmail(request.user.email, request.requestedRole, 'REJECTED');
        return { message: 'Rejected successfully' };
    }
}
