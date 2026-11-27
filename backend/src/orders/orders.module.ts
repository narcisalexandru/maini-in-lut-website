import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Order } from './entities/order.entity';
import { OrderItem } from './entities/order-item.entity';
import { OrderPublicNumber } from './entities/order-public-number.entity';
import { OrdersService } from './orders.service';
import { OrdersController } from './orders.controller';
import { AdminOrdersController } from './admin-orders.controller';
import { AdminDashboardController } from './admin-dashboard.controller';
import { ArtistsModule } from '../artists/artists.module';
import { AuditLogModule } from '../audit-log/audit-log.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Order, OrderItem, OrderPublicNumber]),
    ArtistsModule,
    AuditLogModule,
  ],
  controllers: [
    OrdersController,
    AdminOrdersController,
    AdminDashboardController,
  ],
  providers: [OrdersService],
  exports: [OrdersService],
})
export class OrdersModule {}
