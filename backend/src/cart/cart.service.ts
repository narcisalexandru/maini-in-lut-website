import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserCartItem } from './entities/user-cart-item.entity';
import { ProductsService } from '../products/products.service';
import { StockReservationsService } from '../stock-reservations/stock-reservations.service';

export type CartItemDto = { productId: number; quantity: number };

@Injectable()
export class CartService {
  constructor(
    @InjectRepository(UserCartItem)
    private cartRepository: Repository<UserCartItem>,
    private productsService: ProductsService,
    private stockReservationsService: StockReservationsService,
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
    const product = await this.productsService.findOne(productId);
    if (!product) {
      throw new NotFoundException(`Product with ID ${productId} not found`);
    }

    const items = await this.findAll(userId);
    const existing = items.find((item) => item.productId === productId);
    const nextItems = existing
      ? items.map((item) =>
          item.productId === productId
            ? { ...item, quantity: item.quantity + quantity }
            : item,
        )
      : [...items, { productId, quantity }];

    const synced = await this.syncUserCart(userId, nextItems);
    const saved = synced.find((item) => item.productId === productId);
    if (!saved) {
      throw new BadRequestException('Produsul nu mai este disponibil in stoc.');
    }
    return saved;
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

    const product = await this.productsService.findOne(productId);
    if (!product) {
      throw new NotFoundException(`Product with ID ${productId} not found`);
    }

    const items = await this.findAll(userId);
    const hasItem = items.some((item) => item.productId === productId);
    const nextItems = hasItem
      ? items.map((item) =>
          item.productId === productId ? { ...item, quantity } : item,
        )
      : [...items, { productId, quantity }];

    const synced = await this.syncUserCart(userId, nextItems);
    return synced.find((item) => item.productId === productId) ?? null;
  }

  async remove(userId: number, productId: number): Promise<{ success: boolean }> {
    const items = await this.findAll(userId);
    const nextItems = items.filter((item) => item.productId !== productId);
    await this.syncUserCart(userId, nextItems);
    return { success: true };
  }

  async merge(
    userId: number,
    items: CartItemDto[],
    guestId?: string,
  ): Promise<CartItemDto[]> {
    if (!Array.isArray(items) || items.length === 0) {
      return this.findAll(userId);
    }

    const current = await this.findAll(userId);
    const merged = new Map<number, number>();
    for (const item of current) {
      merged.set(item.productId, item.quantity);
    }
    for (const { productId, quantity } of items) {
      if (!Number.isInteger(productId) || quantity < 1) {
        continue;
      }
      merged.set(productId, (merged.get(productId) ?? 0) + quantity);
    }

    const nextItems = [...merged.entries()].map(([productId, quantity]) => ({
      productId,
      quantity,
    }));
    const synced = await this.syncUserCart(userId, nextItems);

    if (guestId?.trim()) {
      await this.stockReservationsService.releaseHolder({
        type: 'guest',
        guestId: guestId.trim(),
      });
    }

    return synced;
  }

  async clearCart(userId: number): Promise<void> {
    await this.cartRepository.delete({ userId });
    await this.stockReservationsService.releaseHolder({
      type: 'user',
      userId,
    });
  }

  private async syncUserCart(
    userId: number,
    items: CartItemDto[],
  ): Promise<CartItemDto[]> {
    const { items: synced } = await this.stockReservationsService.syncForHolder(
      { type: 'user', userId },
      items,
    );
    await this.reconcileCart(userId, synced);
    return synced;
  }

  private async reconcileCart(
    userId: number,
    items: CartItemDto[],
  ): Promise<void> {
    const current = await this.cartRepository.find({ where: { userId } });
    const targetMap = new Map(items.map((item) => [item.productId, item.quantity]));

    for (const row of current) {
      const targetQuantity = targetMap.get(row.productId);
      if (targetQuantity === undefined) {
        await this.cartRepository.delete({ userId, productId: row.productId });
        continue;
      }
      if (row.quantity !== targetQuantity) {
        row.quantity = targetQuantity;
        await this.cartRepository.save(row);
      }
      targetMap.delete(row.productId);
    }

    for (const [productId, quantity] of targetMap) {
      const item = this.cartRepository.create({ userId, productId, quantity });
      await this.cartRepository.save(item);
    }
  }
}
