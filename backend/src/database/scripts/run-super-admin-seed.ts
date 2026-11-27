import { NestFactory } from '@nestjs/core';
import { AppModule } from '../../app.module';
import { SuperAdminSeedService } from '../super-admin-seed.service';

async function runSuperAdminSeed(): Promise<void> {
  const app = await NestFactory.createApplicationContext(AppModule, {
    logger: ['error', 'warn', 'log'],
  });

  try {
    await app.get(SuperAdminSeedService).seedSuperAdmins();
  } finally {
    await app.close();
  }
}

runSuperAdminSeed().catch((error: unknown) => {
  console.error('Super-admin seed failed', error);
  process.exit(1);
});
