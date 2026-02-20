import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserCartItem } from './entities/user-cart-item.entity';
import { ProductsService } from '../products/products.service';

export type CartItemDto = { productId: number; quantity: number };

@Injectable()
export class CartService {
  constructor(
    @InjectRepository(UserCartItem)
    private cartRepository: Repository<UserCartItem>,
    private productsService: ProductsService,
  ) {}

  async findAll(userId: number): Promise<CartItemDto[]> {
    const items = await this.cartRepository.find({
      where: { userId },
      select: ['productId', 'quantity'],
    });
    return items.map((i) => ({ productId: i.productId, quantity: i.quantity }));
  }

  async add(
    userId: number,
    productId: number,
    quantity = 1,
  ): Promise<CartItemDto> {
    const product = this.productsService.findOne(productId);
    if (!product) {
      throw new NotFoundException(`Product with ID ${productId} not found`);
    }

    const existing = await this.cartRepository.findOne({
      where: { userId, productId },
    });
    if (existing) {
      existing.quantity += quantity;
      await this.cartRepository.save(existing);
      return { productId, quantity: existing.quantity };
    }

    const item = this.cartRepository.create({
      userId,
      productId,
      quantity,
    });
    await this.cartRepository.save(item);
    return { productId, quantity: item.quantity };
  }

  async setQuantity(
    userId: number,
    productId: number,
    quantity: number,
  ): Promise<CartItemDto | null> {
    if (quantity <= 0) {
      await this.remove(userId, productId);
      return null;
    }

    const product = this.productsService.findOne(productId);
    if (!product) {
      throw new NotFoundException(`Product with ID ${productId} not found`);
    }

    const existing = await this.cartRepository.findOne({
      where: { userId, productId },
    });
    if (!existing) {
      const item = this.cartRepository.create({
        userId,
        productId,
        quantity,
      });
      await this.cartRepository.save(item);
      return { productId, quantity };
    }

    existing.quantity = quantity;
    await this.cartRepository.save(existing);
    return { productId, quantity: existing.quantity };
  }

  async remove(userId: number, productId: number): Promise<{ success: boolean }> {
    const result = await this.cartRepository.delete({
      userId,
      productId,
    });
    return { success: (result.affected ?? 0) > 0 };
  }

  async merge(userId: number, items: CartItemDto[]): Promise<CartItemDto[]> {
    if (!Array.isArray(items) || items.length === 0) {
      return this.findAll(userId);
    }

    for (const { productId, quantity } of items) {
      const product = this.productsService.findOne(productId);
      if (!product) continue;

      const existing = await this.cartRepository.findOne({
        where: { userId, productId },
      });
      if (existing) {
        existing.quantity += quantity;
        await this.cartRepository.save(existing);
      } else {
        const item = this.cartRepository.create({
          userId,
          productId,
          quantity,
        });
        await this.cartRepository.save(item);
      }
    }

    return this.findAll(userId);
  }
}
