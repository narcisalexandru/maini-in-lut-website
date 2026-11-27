import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Artist } from '../artists/entities/artist.entity';
import { Product } from '../products/entities/product.entity';
import { UploadsController } from './uploads.controller';
import { UploadsService } from './uploads.service';

@Module({
  imports: [TypeOrmModule.forFeature([Artist, Product])],
  controllers: [UploadsController],
  providers: [UploadsService],
})
export class UploadsModule {}
