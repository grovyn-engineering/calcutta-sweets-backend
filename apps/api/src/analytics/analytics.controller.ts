import { Controller, Get, Query, Req, UseGuards } from '@nestjs/common';
import type { Request } from 'express';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ShopScopeGuard } from '../auth/shop-scope.guard';
import { AnalyticsService } from './analytics.service';

@Controller('analytics')
@UseGuards(JwtAuthGuard, ShopScopeGuard)
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Get('dashboard')
  dashboard(@Req() req: Request) {
    return this.analyticsService.getDashboard(req.effectiveShopCode!);
  }

  @Get('reports/summary')
  reportsSummary(
    @Req() req: Request,
    @Query('days') daysStr?: string,
  ) {
    const days = Math.min(
      90,
      Math.max(7, parseInt(daysStr ?? '30', 10) || 30),
    );
    return this.analyticsService.getReportsSummary(
      req.effectiveShopCode!,
      days,
    );
  }
}
