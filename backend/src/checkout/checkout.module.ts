import { Module } from '@nestjs/common';
import { CheckoutService } from './checkout.service';
import { CheckoutController } from './checkout.controller';
import { CartModule } from '../cart/cart.module';
import { ProductsModule } from '../products/products.module';
import { UsersModule } from '../users/users.module';
import { EmailModule } from '../email/email.module';
import { OrdersModule } from '../orders/orders.module';
import { ArtistsModule } from '../artists/artists.module';
import { StockReservationsModule } from '../stock-reservations/stock-reservations.module';

@Module({
  imports: [
    CartModule,
    ProductsModule,
    UsersModule,
    EmailModule,
    OrdersModule,
    ArtistsModule,
    StockReservationsModule,
  ],
  controllers: [CheckoutController],
  providers: [CheckoutService],
})
export class CheckoutModule {}
