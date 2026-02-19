import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserFavorite } from './entities/user-favorite.entity';
import { ProductsService } from '../products/products.service';

@Injectable()
export class FavoritesService {
  constructor(
    @InjectRepository(UserFavorite)
    private favoritesRepository: Repository<UserFavorite>,
    private productsService: ProductsService,
  ) {}

  async findAll(userId: number): Promise<number[]> {
    const favorites = await this.favoritesRepository.find({
      where: { userId },
      select: ['productId'],
    });
    return favorites.map((f) => f.productId);
  }

  async add(userId: number, productId: number): Promise<{ productId: number }> {
    const product = this.productsService.findOne(productId);
    if (!product) {
      throw new NotFoundException(`Product with ID ${productId} not found`);
    }

    const existing = await this.favoritesRepository.findOne({
      where: { userId, productId },
    });
    if (existing) {
      return { productId };
    }

    const favorite = this.favoritesRepository.create({ userId, productId });
    await this.favoritesRepository.save(favorite);
    return { productId };
  }

  async remove(
    userId: number,
    productId: number,
  ): Promise<{ success: boolean }> {
    const result = await this.favoritesRepository.delete({
      userId,
      productId,
    });
    return { success: (result.affected ?? 0) > 0 };
  }

  async addMany(userId: number, productIds: number[]): Promise<number[]> {
    const added: number[] = [];
    for (const productId of productIds) {
      const product = this.productsService.findOne(productId);
      if (!product) continue;

      const existing = await this.favoritesRepository.findOne({
        where: { userId, productId },
      });
      if (existing) continue;

      const favorite = this.favoritesRepository.create({ userId, productId });
      await this.favoritesRepository.save(favorite);
      added.push(productId);
    }
    return added;
  }
}
