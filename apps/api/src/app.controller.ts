import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';
import { PrismaService } from './prisma.service';

@Controller()
export class AppController {
  constructor(
    private readonly appService: AppService,
    private readonly prisma: PrismaService,
  ) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  /** Verify database connection */
  @Get('health/db')
  async checkDb() {
    const ok = await this.prisma.isHealthy();
    return {
      database: ok ? 'connected' : 'disconnected',
      timestamp: new Date().toISOString(),
    };
  }
}
