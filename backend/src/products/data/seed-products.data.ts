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

export const SEED_PRODUCTS: SeedProductInput[] = [
  {
    title: 'Cana gâscă ',
    description:
      'Cana din lut ars cu motive de căpșuni, perfectă pentru cafea sau ceai',
    price: 150.0,
    image: '/images/products/cana_gasca_iarna.jpg',
    inStock: true,
    category: 'Căni',
    datePublished: new Date('2024-06-01'),
    popularity: 120,
    discount: 10,
    reviewsCount: 15,
    priceBeforeDiscount: 160.0,
  },
  {
    title: 'Vază - Flori de Primăvară',
    description:
      'Vază decorativă cu motive florale, ideală pentru buchete de primăvară',
    price: 85.0,
    image: '/images/products/image-49.png',
    inStock: true,
    category: 'Vaze',
    datePublished: new Date('2024-05-20'),
    popularity: 80,
    discount: 0,
    reviewsCount: 8,
    priceBeforeDiscount: null,
  },
  {
    title: 'Set 3 Căni - Culori Pastel',
    description:
      'Set de 3 căni din lut cu culori pastel, perfecte pentru familie',
    price: 120.0,
    image: '/images/products/image-42.png',
    inStock: true,
    category: 'Căni',
    datePublished: new Date('2024-06-10'),
    popularity: 200,
    discount: 15,
    reviewsCount: 22,
    priceBeforeDiscount: 140.0,
  },
  {
    title: 'Platou - Motive Tradiționale',
    description: 'Platou decorativ cu motive tradiționale românești',
    price: 65.0,
    image: '/images/products/image-47.png',
    inStock: true,
    category: 'Platouri',
    datePublished: new Date('2024-04-15'),
    popularity: 60,
    discount: 0,
    reviewsCount: 5,
    priceBeforeDiscount: null,
  },
  {
    title: 'Cănițe - Set 6 Bucăți',
    description: 'Set de 6 cănițe pentru espresso, cu design modern',
    price: 150.0,
    image: '/images/products/image-46.png',
    inStock: true,
    category: 'Căni',
    datePublished: new Date('2024-06-12'),
    popularity: 90,
    discount: 5,
    reviewsCount: 10,
    priceBeforeDiscount: 160.0,
  },
  {
    title: 'Vază - Design Modern',
    description:
      'Vază modernă cu design minimalist, perfectă pentru orice decor',
    price: 95.0,
    image: '/images/products/image-43.png',
    inStock: true,
    category: 'Vaze',
    datePublished: new Date('2024-05-28'),
    popularity: 110,
    discount: 0,
    reviewsCount: 12,
    priceBeforeDiscount: null,
  },
  {
    title: 'Platou - Frunze de Toamnă',
    description: 'Platou decorativ cu motive de frunze de toamnă',
    price: 75.0,
    image: '/images/products/image-44.png',
    inStock: true,
    category: 'Platouri',
    datePublished: new Date('2024-04-30'),
    popularity: 40,
    discount: 0,
    reviewsCount: 3,
    priceBeforeDiscount: null,
  },
  {
    title: 'Cana cu Toartă - Motive Geometrice',
    description: 'Cana din lut cu design geometric modern',
    price: 50.0,
    image: '/images/products/image-43.png',
    inStock: true,
    category: 'Căni',
    datePublished: new Date('2024-06-15'),
    popularity: 300,
    discount: 20,
    reviewsCount: 30,
    priceBeforeDiscount: 62.5,
  },
  {
    title: 'Set 4 Farfurii - Design Rustic',
    description: 'Set de 4 farfurii cu design rustic, perfecte pentru masă',
    price: 180.0,
    image: '/images/products/image-42.png',
    inStock: true,
    category: 'Farfurii',
    datePublished: new Date('2024-06-05'),
    popularity: 70,
    discount: 0,
    reviewsCount: 7,
    priceBeforeDiscount: null,
  },
  {
    title: 'Vază - Motive Marine',
    description:
      'Vază decorativă cu motive marine, ideală pentru decorul de vară',
    price: 110.0,
    image: '/images/products/image-41.png',
    inStock: true,
    category: 'Vaze',
    datePublished: new Date('2024-05-18'),
    popularity: 95,
    discount: 0,
    reviewsCount: 9,
    priceBeforeDiscount: null,
  },
];

export const PLATFORM_ARTIST_SLUG = 'maini-in-lut';
export const PLATFORM_ARTIST_NAME = 'Maini in Lut';
