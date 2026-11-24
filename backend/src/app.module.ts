import { Module } from '@nestjs/common';
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

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ThrottlerModule.forRoot([
      {
        ttl: 60_000,
        limit: 120,
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
  ],
  controllers: [AppController],
  providers: [AppService, { provide: APP_GUARD, useClass: ThrottlerGuard }],
})
export class AppModule {}
