import { BadRequestException, Controller, Get, Query, Req, UseGuards } from '@nestjs/common';
import type { Request } from 'express';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { PermissionsGuard } from '../auth/permissions.guard';
import { RequirePermission } from '../auth/permissions.decorator';
import { ShopScopeGuard } from '../auth/shop-scope.guard';
import { AnalyticsService } from './analytics.service';

@Controller('analytics')
@UseGuards(JwtAuthGuard, ShopScopeGuard, PermissionsGuard)
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) { }

  @Get('dashboard')
  @RequirePermission('canAccessDashboard')
  dashboard(@Req() req: Request) {
    return this.analyticsService.getDashboard(req.effectiveShopCode!);
  }

  @Get('reports/summary')
  @RequirePermission('canAccessReports')
  reportsSummary(
    @Req() req: Request,
    @Query('days') daysStr?: string,
    @Query('start') start?: string,
    @Query('end') end?: string,
    @Query('month') month?: string,
    @Query('bucket') bucket?: string,
  ) {
    const days = Math.min(
      180,
      Math.max(7, parseInt(daysStr ?? '30', 10) || 30),
    );
    return this.analyticsService.getReportsSummary(
      req.effectiveShopCode!,
      {
        days,
        start,
        end,
        month,
        bucket: bucket === 'month' ? 'month' : 'day',
      },
    );
  }

  @Get('gst-summary')
  @RequirePermission('canAccessReports')
  gstSummary(@Req() req: Request, @Query('month') month?: string) {
    if (!month?.trim()) {
      throw new BadRequestException('month is required (YYYY-MM)');
    }
    return this.analyticsService.getGstMonthlySummary(
      req.effectiveShopCode!,
      month.trim(),
    );
  }

  @Get('reports/export-data')
  @RequirePermission('canAccessReports')
  reportsExportData(
    @Req() req: Request,
    @Query('days') daysStr?: string,
    @Query('start') start?: string,
    @Query('end') end?: string,
    @Query('month') month?: string,
    @Query('bucket') bucket?: string,
  ) {
    const days = Math.min(
      180,
      Math.max(7, parseInt(daysStr ?? '30', 10) || 30),
    );
    return this.analyticsService.getReportsExportData(
      req.effectiveShopCode!,
      {
        days,
        start,
        end,
        month,
        bucket: bucket === 'month' ? 'month' : 'day',
      },
    );
  }
}
