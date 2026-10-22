import { RequestMethod, ValidationPipe } from '@nestjs/common';
import { HttpAdapterHost } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { DecimalToNumberInterceptor } from './common/decimal-to-number.interceptor';
import { PrismaExceptionFilter } from './common/prisma-exception.filter';

/** Global pipes, interceptors, filters and route prefix. Shared by main.ts and the e2e tests. */
export function configureApp(app: NestExpressApplication) {
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );
  app.useGlobalInterceptors(new DecimalToNumberInterceptor());
  app.useGlobalFilters(
    new PrismaExceptionFilter(app.get(HttpAdapterHost).httpAdapter),
  );
  app.setGlobalPrefix('api', {
    exclude: [{ path: 'health', method: RequestMethod.GET }],
  });
}
