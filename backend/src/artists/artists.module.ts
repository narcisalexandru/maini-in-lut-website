import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { Artist } from './entities/artist.entity';
import { ArtistsService } from './artists.service';
import { ArtistsController } from './artists.controller';
import { AdminArtistsController } from './admin-artists.controller';
import { UsersModule } from '../users/users.module';
import { EmailModule } from '../email/email.module';
import { AuditLogModule } from '../audit-log/audit-log.module';
import { Product } from '../products/entities/product.entity';
import { OrderItem } from '../orders/entities/order-item.entity';
import { UserCartItem } from '../cart/entities/user-cart-item.entity';
import { UserFavorite } from '../favorites/entities/user-favorite.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Artist,
      Product,
      OrderItem,
      UserCartItem,
      UserFavorite,
    ]),
    UsersModule,
    EmailModule,
    AuditLogModule,
    ConfigModule,
  ],
  controllers: [ArtistsController, AdminArtistsController],
  providers: [ArtistsService],
  exports: [ArtistsService],
})
export class ArtistsModule {}
