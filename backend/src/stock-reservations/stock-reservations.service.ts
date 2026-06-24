import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, LessThan, Repository } from 'typeorm';
import { Product } from '../products/entities/product.entity';
import { StockReservation } from './entities/stock-reservation.entity';
import { STOCK_RESERVATION_TTL_MS } from './stock-reservation.constants';
import {
  CartHolder,
  toHolderColumns,
} from './types/cart-holder.type';

export type ReservationCartItem = { productId: number; quantity: number };

export type SyncReservationsResult = {
  items: ReservationCartItem[];
  expiresAt: string;
};

@Injectable()
export class StockReservationsService {
  constructor(
    @InjectRepository(StockReservation)
    private readonly reservationRepository: Repository<StockReservation>,
    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,
  ) {}

  async releaseExpired(): Promise<void> {
    await this.reservationRepository.delete({
      expiresAt: LessThan(new Date()),
    });
  }

  async getTotalReserved(productId: number): Promise<number> {
    await this.releaseExpired();
    const row = await this.reservationRepository
      .createQueryBuilder('reservation')
      .select('COALESCE(SUM(reservation.quantity), 0)', 'total')
      .where('reservation.productId = :productId', { productId })
      .andWhere('reservation.expiresAt > :now', { now: new Date() })
      .getRawOne<{ total: string }>();
    return Number(row?.total ?? 0);
  }

  async getReservedByOthers(
    productId: number,
    holder: CartHolder,
  ): Promise<number> {
    await this.releaseExpired();
    const { holderType, holderId } = toHolderColumns(holder);
    const row = await this.reservationRepository
      .createQueryBuilder('reservation')
      .select('COALESCE(SUM(reservation.quantity), 0)', 'total')
      .where('reservation.productId = :productId', { productId })
      .andWhere('reservation.expiresAt > :now', { now: new Date() })
      .andWhere(
        'NOT (reservation.holderType = :holderType AND reservation.holderId = :holderId)',
        { holderType, holderId },
      )
      .getRawOne<{ total: string }>();
    return Number(row?.total ?? 0);
  }

  async getAvailableForHolder(
    product: Product,
    holder?: CartHolder,
  ): Promise<number> {
    if (!product.inStock) {
      return 0;
    }
    const base = Math.max(0, product.stockQuantity ?? 0);
    if (!holder) {
      const reserved = await this.getTotalReserved(product.id);
      return Math.max(0, base - reserved);
    }
    const reservedByOthers = await this.getReservedByOthers(product.id, holder);
    return Math.max(0, base - reservedByOthers);
  }

  async getAvailableStockMap(
    products: Product[],
    holder?: CartHolder,
  ): Promise<Map<number, number>> {
    await this.releaseExpired();
    const map = new Map<number, number>();
    for (const product of products) {
      map.set(product.id, await this.getAvailableForHolder(product, holder));
    }
    return map;
  }

  async syncForHolder(
    holder: CartHolder,
    items: ReservationCartItem[],
  ): Promise<SyncReservationsResult> {
    await this.releaseExpired();
    const expiresAt = new Date(Date.now() + STOCK_RESERVATION_TTL_MS);
    const { holderType, holderId } = toHolderColumns(holder);
    const sanitized = (items ?? []).filter(
      (item) =>
        Number.isInteger(item.productId) &&
        item.productId > 0 &&
        Number.isInteger(item.quantity) &&
        item.quantity > 0,
    );

    const synced: ReservationCartItem[] = [];
    const keptProductIds: number[] = [];

    for (const item of sanitized) {
      const product = await this.productRepository.findOne({
        where: { id: item.productId },
      });
      if (!product) {
        continue;
      }

      const maxAvailable = await this.getAvailableForHolder(product, holder);
      const quantity = Math.min(item.quantity, maxAvailable);
      if (quantity <= 0) {
        continue;
      }

      let reservation = await this.reservationRepository.findOne({
        where: { productId: item.productId, holderType, holderId },
      });
      if (!reservation) {
        reservation = this.reservationRepository.create({
          productId: item.productId,
          holderType,
          holderId,
          quantity,
          expiresAt,
        });
      } else {
        reservation.quantity = quantity;
        reservation.expiresAt = expiresAt;
      }
      await this.reservationRepository.save(reservation);
      synced.push({ productId: item.productId, quantity });
      keptProductIds.push(item.productId);
    }

    if (keptProductIds.length === 0) {
      await this.reservationRepository.delete({ holderType, holderId });
    } else {
      await this.reservationRepository
        .createQueryBuilder()
        .delete()
        .where('holderType = :holderType', { holderType })
        .andWhere('holderId = :holderId', { holderId })
        .andWhere('productId NOT IN (:...keptProductIds)', { keptProductIds })
        .execute();
    }

    return { items: synced, expiresAt: expiresAt.toISOString() };
  }

  async releaseHolder(holder: CartHolder): Promise<void> {
    const { holderType, holderId } = toHolderColumns(holder);
    await this.reservationRepository.delete({ holderType, holderId });
  }

  async fulfillOrder(
    items: ReservationCartItem[],
    holder?: CartHolder,
  ): Promise<void> {
    if (!items.length) {
      return;
    }

    for (const item of items) {
      const product = await this.productRepository.findOne({
        where: { id: item.productId },
      });
      if (!product) {
        throw new NotFoundException(`Product with ID ${item.productId} not found`);
      }
      if (product.stockQuantity < item.quantity) {
        throw new BadRequestException(
          `Stoc insuficient pentru "${product.title}".`,
        );
      }
      product.stockQuantity -= item.quantity;
      if (product.stockQuantity <= 0) {
        product.stockQuantity = 0;
        product.inStock = false;
      }
      await this.productRepository.save(product);
    }

    const productIds = [...new Set(items.map((item) => item.productId))];
    await this.reservationRepository.delete({
      productId: In(productIds),
    });

    if (holder) {
      await this.releaseHolder(holder);
    }
  }
}
