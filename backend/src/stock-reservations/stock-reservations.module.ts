import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Product } from '../products/entities/product.entity';
import { StockReservation } from './entities/stock-reservation.entity';
import { GuestCartReservationsController } from './guest-cart-reservations.controller';
import { GuestHolderService } from './guest-holder.service';
import { StockReservationsService } from './stock-reservations.service';

@Module({
  imports: [TypeOrmModule.forFeature([StockReservation, Product])],
  controllers: [GuestCartReservationsController],
  providers: [StockReservationsService, GuestHolderService],
  exports: [StockReservationsService, GuestHolderService],
})
export class StockReservationsModule {}
