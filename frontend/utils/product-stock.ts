export const LIMITED_STOCK_THRESHOLD = 5;

type StockProduct = {
  inStock?: boolean;
  stockQuantity?: number | null;
};

export function getProductStockQuantity(product: StockProduct): number {
  if (product.inStock === false) {
    return 0;
  }
  return Math.max(0, Number(product.stockQuantity ?? 0));
}

export function isProductAvailable(product: StockProduct): boolean {
  return getProductStockQuantity(product) > 0;
}

export function isLimitedStock(stockQuantity: number): boolean {
  return stockQuantity > 1 && stockQuantity <= LIMITED_STOCK_THRESHOLD;
}

export function isLastProduct(stockQuantity: number): boolean {
  return stockQuantity === 1;
}

export type StockDisplayStatus =
  | "out_of_stock"
  | "last_product"
  | "limited"
  | "in_stock";

export function getStockDisplayStatus(
  product: StockProduct,
): StockDisplayStatus {
  const quantity = getProductStockQuantity(product);
  if (quantity <= 0) {
    return "out_of_stock";
  }
  if (quantity === 1) {
    return "last_product";
  }
  if (quantity <= LIMITED_STOCK_THRESHOLD) {
    return "limited";
  }
  return "in_stock";
}

export function getStockProgressPercent(stockQuantity: number): number {
  if (stockQuantity <= 0) {
    return 0;
  }
  if (stockQuantity > LIMITED_STOCK_THRESHOLD) {
    return 100;
  }
  return Math.round((stockQuantity / LIMITED_STOCK_THRESHOLD) * 100);
}

export function clampQuantityToStock(
  quantity: number,
  maxStock: number,
): number {
  if (maxStock <= 0) {
    return 0;
  }
  return Math.min(Math.max(1, Math.floor(quantity)), maxStock);
}

export function clampTotalCartQuantity(
  desiredTotal: number,
  maxStock: number,
): number {
  if (maxStock <= 0) {
    return 0;
  }
  return Math.min(Math.max(0, Math.floor(desiredTotal)), maxStock);
}
