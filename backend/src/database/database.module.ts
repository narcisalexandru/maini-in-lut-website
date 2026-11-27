import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from '../users/entities/user.entity';
import { SuperAdminSeedService } from './super-admin-seed.service';
import { ProductSeedService } from './product-seed.service';
import { ProductsModule } from '../products/products.module';
import { ArtistsModule } from '../artists/artists.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([User]),
    ProductsModule,
    ArtistsModule,
  ],
  providers: [SuperAdminSeedService, ProductSeedService],
})
export class DatabaseModule {}
