import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProductsService } from './products.service';
import { ProductsController } from './products.controller';
import { AdminProductsController } from './admin-products.controller';
import { Product } from './entities/product.entity';
import { ProductChangeProposal } from './entities/product-change-proposal.entity';
import { ArtistsModule } from '../artists/artists.module';
import { UsersModule } from '../users/users.module';
import { EmailModule } from '../email/email.module';
import { AuditLogModule } from '../audit-log/audit-log.module';
import { StockReservationsModule } from '../stock-reservations/stock-reservations.module';
import { UserCartItem } from '../cart/entities/user-cart-item.entity';
import { UserFavorite } from '../favorites/entities/user-favorite.entity';
import { StockReservation } from '../stock-reservations/entities/stock-reservation.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Product,
      ProductChangeProposal,
      UserCartItem,
      UserFavorite,
      StockReservation,
    ]),
    ArtistsModule,
    UsersModule,
    EmailModule,
    AuditLogModule,
    StockReservationsModule,
    ConfigModule,
  ],
  controllers: [ProductsController, AdminProductsController],
  providers: [ProductsService],
  exports: [ProductsService],
})
export class ProductsModule {}
