import { Controller, Post, Get, Patch, Param, Body, UseGuards, Req } from '@nestjs/common';
import { Request } from 'express';
import { RoleRequestsService } from './role-requests.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { UserRole } from '@prisma/client';

@Controller('role-requests')
@UseGuards(JwtAuthGuard, RolesGuard)
export class RoleRequestsController {
    constructor(private readonly roleRequestsService: RoleRequestsService) { }

    @Post()
    create(@Req() req: Request, @Body() dto: { requestedRole: UserRole }) {
        const userId = (req.user as any).sub || (req.user as any).id;
        const shopCode = req.effectiveShopCode || (req.user as any).shopCode;
        return this.roleRequestsService.create(userId, shopCode, dto.requestedRole);
    }

    @Get()
    @Roles(UserRole.SUPER_ADMIN)
    findAll(@Req() req: Request) {
        // Super admin sees all, or can filter by shop code.
        return this.roleRequestsService.findAll();
    }

    @Patch(':id/approve')
    @Roles(UserRole.SUPER_ADMIN)
    approve(@Param('id') id: string) {
        return this.roleRequestsService.approve(id);
    }

    @Patch(':id/reject')
    @Roles(UserRole.SUPER_ADMIN)
    reject(@Param('id') id: string) {
        return this.roleRequestsService.reject(id);
    }
}
