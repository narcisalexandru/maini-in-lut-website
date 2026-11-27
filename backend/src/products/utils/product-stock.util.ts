import { BadRequestException } from '@nestjs/common';
import { Product } from '../entities/product.entity';

export function getAvailableStock(product: Product): number {
  if (!product.inStock) {
    return 0;
  }
  return Math.max(0, product.stockQuantity ?? 0);
}

export function clampToAvailableStock(
  quantity: number,
  maxStock: number,
): number {
  if (maxStock <= 0) {
    return 0;
  }
  return Math.min(Math.max(1, Math.floor(quantity)), maxStock);
}

export function assertPurchasableStock(
  product: Product,
  desiredQuantity: number,
): number {
  const maxStock = getAvailableStock(product);
  if (maxStock <= 0) {
    throw new BadRequestException('Product is out of stock');
  }

  const clamped = Math.min(Math.floor(desiredQuantity), maxStock);
  if (clamped < 1) {
    throw new BadRequestException('Requested quantity exceeds available stock');
  }

  return clamped;
}
