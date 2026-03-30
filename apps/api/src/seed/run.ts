import { NestFactory } from '@nestjs/core';
import { SeedModule } from './seed.module';
import { SeedService } from './seed.service';

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(SeedModule);
  const seedService = app.get(SeedService);
  try {
    await seedService.run();
  } finally {
    await app.close();
  }
}

void bootstrap().catch((err) => {
  console.error(err);
  process.exit(1);
});
