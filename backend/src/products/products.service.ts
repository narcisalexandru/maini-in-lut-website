import { Injectable } from '@nestjs/common';
import { Product } from './entities/product.entity';

@Injectable()
export class ProductsService {
  private readonly products: Product[] = [
    {
      id: 1,
      title: {
        ro: 'Cana cu toartă - Căpșuni',
        en: 'Mug with Handle - Strawberries',
      },
      description:
        'Cana din lut ars cu motive de căpșuni, perfectă pentru cafea sau ceai',
      price: 45.0,
      image: '/images/products/image-41.png',
      inStock: true,
      category: 'Căni',
      datePublished: new Date('2024-06-01'),
      popularity: 120,
      discount: 10,
      reviewsCount: 15,
      priceBeforeDiscount: 50.0,
    },
    {
      id: 2,
      title: { ro: 'Vază - Flori de Primăvară', en: 'Vase - Spring Flowers' },
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
      id: 3,
      title: {
        ro: 'Set 3 Căni - Culori Pastel',
        en: 'Set of 3 Mugs - Pastel Colors',
      },
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
      id: 4,
      title: {
        ro: 'Platou - Motive Tradiționale',
        en: 'Plate - Traditional Motifs',
      },
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
      id: 5,
      title: { ro: 'Cănițe - Set 6 Bucăți', en: 'Mugs - Set of 6 Pieces' },
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
      id: 6,
      title: { ro: 'Vază - Design Modern', en: 'Vase - Modern Design' },
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
      id: 7,
      title: { ro: 'Platou - Frunze de Toamnă', en: 'Plate - Autumn Leaves' },
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
      id: 8,
      title: {
        ro: 'Cana cu Toartă - Motive Geometrice',
        en: 'Mug with Handle - Geometric Motifs',
      },
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
      id: 9,
      title: {
        ro: 'Set 4 Farfurii - Design Rustic',
        en: 'Set of 4 Plates - Rustic Design',
      },
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
      id: 10,
      title: { ro: 'Vază - Motive Marine', en: 'Vase - Marine Motifs' },
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

  findAll(): Product[] {
    return this.products;
  }

  findOne(id: number): Product | undefined {
    return this.products.find((product) => product.id === id);
  }
}
