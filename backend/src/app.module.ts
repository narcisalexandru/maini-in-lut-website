import { ExecutionContext, Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ProductsModule } from './products/products.module';
import { FavoritesModule } from './favorites/favorites.module';
import { CartModule } from './cart/cart.module';
import { CheckoutModule } from './checkout/checkout.module';
import { ArtistsModule } from './artists/artists.module';
import { OrdersModule } from './orders/orders.module';
import { DatabaseModule } from './database/database.module';
import { AuditLogModule } from './audit-log/audit-log.module';
import { UploadsModule } from './uploads/uploads.module';
import { StockReservationsModule } from './stock-reservations/stock-reservations.module';
import { SiteSettingsModule } from './site-settings/site-settings.module';
import { AdminWorkspaceModule } from './admin-workspace/admin-workspace.module';
import { InvoicesModule } from './invoices/invoices.module';

const PUBLIC_RATE_LIMIT = 120;
const ADMIN_RATE_LIMIT = 3000;
const RATE_LIMIT_WINDOW_MS = 60_000;

function isAdminRequest(context: ExecutionContext): boolean {
  const request = context.switchToHttp().getRequest<{ path?: string; url?: string }>();
  const path = (request.path || request.url || '').split('?')[0];
  return path === '/admin' || path.startsWith('/admin/');
}

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ThrottlerModule.forRoot([
      {
        name: 'default',
        ttl: RATE_LIMIT_WINDOW_MS,
        limit: PUBLIC_RATE_LIMIT,
        skipIf: isAdminRequest,
      },
      {
        name: 'admin',
        ttl: RATE_LIMIT_WINDOW_MS,
        limit: ADMIN_RATE_LIMIT,
        skipIf: (context) => !isAdminRequest(context),
      },
    ]),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => {
        const isProduction = configService.get<string>('NODE_ENV') === 'production';
        const host = configService.get<string>('DATABASE_HOST');
        const sslFlag = configService.get<string>('DATABASE_SSL')?.trim().toLowerCase();
        const localHost = !host || host === 'localhost' || host === '127.0.0.1';
        const ssl =
          sslFlag === 'false'
            ? false
            : sslFlag === 'true' || !localHost
              ? { rejectUnauthorized: true }
              : false;
        return {
          type: 'postgres' as const,
          host,
          port: configService.get<number>('DATABASE_PORT'),
          username: configService.get<string>('DATABASE_USER'),
          password: configService.get<string>('DATABASE_PASSWORD'),
          database: configService.get<string>('DATABASE_NAME'),
          ssl,
          autoLoadEntities: true,
          synchronize: !isProduction,
          migrations: [__dirname + '/database/migrations/*{.ts,.js}'],
          migrationsRun: isProduction,
        };
      },
      inject: [ConfigService],
    }),
    AuthModule,
    UsersModule,
    ProductsModule,
    FavoritesModule,
    CartModule,
    CheckoutModule,
    DatabaseModule,
    ArtistsModule,
    OrdersModule,
    AuditLogModule,
    UploadsModule,
    StockReservationsModule,
    SiteSettingsModule,
    AdminWorkspaceModule,
    InvoicesModule,
  ],
  controllers: [AppController],
  providers: [AppService, { provide: APP_GUARD, useClass: ThrottlerGuard }],
})
export class AppModule {}
