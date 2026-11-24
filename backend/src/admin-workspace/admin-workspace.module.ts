import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AdminWorkspaceController } from './admin-workspace.controller';
import { AdminWorkspaceService } from './admin-workspace.service';
import { AdminTableRevision } from './entities/admin-table-revision.entity';
import { AdminTableCursor } from './entities/admin-table-cursor.entity';
import { Order } from '../orders/entities/order.entity';
import { OrderItem } from '../orders/entities/order-item.entity';
import { Product } from '../products/entities/product.entity';
import { User } from '../users/entities/user.entity';
import { Artist } from '../artists/entities/artist.entity';
import { OrdersModule } from '../orders/orders.module';
import { ProductsModule } from '../products/products.module';
import { UsersModule } from '../users/users.module';
import { ArtistsModule } from '../artists/artists.module';
import { AuditLogModule } from '../audit-log/audit-log.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      AdminTableRevision,
      AdminTableCursor,
      Order,
      OrderItem,
      Product,
      User,
      Artist,
    ]),
    OrdersModule,
    ProductsModule,
    UsersModule,
    ArtistsModule,
    AuditLogModule,
  ],
  controllers: [AdminWorkspaceController],
  providers: [AdminWorkspaceService],
})
export class AdminWorkspaceModule {}
