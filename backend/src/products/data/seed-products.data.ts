import type { ProductStatus } from '../../common/enums/product-status.enum';

export type SeedProductInput = {
  title: string;
  description: string;
  price: number;
  image: string;
  inStock: boolean;
  category: string;
  datePublished: Date;
  popularity: number;
  discount: number;
  reviewsCount: number;
  priceBeforeDiscount: number | null;
  status?: ProductStatus;
};

export const SEED_PRODUCTS: SeedProductInput[] = [];

export const PLATFORM_ARTIST_SLUG = 'maini-in-lut';
export const PLATFORM_ARTIST_NAME = 'Maini in Lut';
