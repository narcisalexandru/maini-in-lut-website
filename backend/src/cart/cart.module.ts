import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserCartItem } from './entities/user-cart-item.entity';
import { CartService } from './cart.service';
import { CartController } from './cart.controller';
import { ProductsModule } from '../products/products.module';
import { StockReservationsModule } from '../stock-reservations/stock-reservations.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([UserCartItem]),
    ProductsModule,
    StockReservationsModule,
  ],
  controllers: [CartController],
  providers: [CartService],
  exports: [CartService],
})
export class CartModule {}
