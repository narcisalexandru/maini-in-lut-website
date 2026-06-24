import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProductsService } from './products.service';
import { ProductsController } from './products.controller';
import { AdminProductsController } from './admin-products.controller';
import { Product } from './entities/product.entity';
import { ProductChangeProposal } from './entities/product-change-proposal.entity';
import { ArtistsModule } from '../artists/artists.module';
import { AuditLogModule } from '../audit-log/audit-log.module';
import { StockReservationsModule } from '../stock-reservations/stock-reservations.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Product, ProductChangeProposal]),
    ArtistsModule,
    AuditLogModule,
    StockReservationsModule,
  ],
  controllers: [ProductsController, AdminProductsController],
  providers: [ProductsService],
  exports: [ProductsService],
})
export class ProductsModule {}
