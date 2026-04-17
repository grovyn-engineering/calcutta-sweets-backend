import { Controller, Get, Request, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { SettingsService } from './settings.service';

@Controller('settings')
export class SettingsController {
    constructor(private readonly settingsService: SettingsService) { }

    @UseGuards(JwtAuthGuard)
    @Get('role-permissions')
    getRolePermissions(@Request() req) {
        return this.settingsService.mergeEffectivePermissions(
            req.user.role,
            (req.user as { permissionOverrides?: unknown }).permissionOverrides,
        );
    }
}
