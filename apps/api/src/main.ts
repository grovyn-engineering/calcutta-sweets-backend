import { RequestMethod, ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';
import { AppModule } from './app.module';
import { PrismaService } from './prisma.service';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  app.useStaticAssets(join(process.cwd(), 'public', 'uploads'), {
    prefix: '/uploads',
  });
  const prisma = app.get(PrismaService);
  app.setGlobalPrefix('api', {
    exclude: [{ path: 'health', method: RequestMethod.GET }],
  });
  app.enableCors({
    origin: process.env.CORS_ORIGIN ? process.env.CORS_ORIGIN.split(',') : true,
    methods: ['GET', 'HEAD', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: [
      'Content-Type',
      'Authorization',
      'X-Requested-With',
      'Accept',
      'X-Shop',
    ],
    credentials: true,
  });
  try {
    await prisma.$queryRaw`SELECT 1`;
    console.log('✓ Database connected');
  } catch (err) {
    console.error('✗ Database connection failed:', err);
    process.exit(1);
  }

  await app.listen(process.env.PORT ?? 3000);
  console.log(`API running on http://localhost:${process.env.PORT ?? 3000}`);
}
bootstrap();
