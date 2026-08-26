import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import { ArtistsService } from '../artists/artists.service';
import { ProductsService } from '../products/products.service';
import {
  PLATFORM_ARTIST_NAME,
  PLATFORM_ARTIST_SLUG,
  SEED_PRODUCTS,
} from '../products/data/seed-products.data';

@Injectable()
export class ProductSeedService implements OnApplicationBootstrap {
  private readonly logger = new Logger(ProductSeedService.name);

  constructor(
    private readonly artistsService: ArtistsService,
    private readonly productsService: ProductsService,
  ) {}

  async onApplicationBootstrap(): Promise<void> {
    await this.seedPlatformCatalog();
  }

  async seedPlatformCatalog(): Promise<void> {
    const productCount = await this.productsService.countAll();
    if (productCount > 0) {
      return;
    }

    const platformArtist = await this.artistsService.ensurePlatformArtist(
      PLATFORM_ARTIST_NAME,
      PLATFORM_ARTIST_SLUG,
      'Produse handmade realizate de echipa Maini in Lut.',
    );

    await this.productsService.seedPlatformProducts(
      platformArtist.id,
      SEED_PRODUCTS,
    );

    this.logger.log(
      `Seeded ${SEED_PRODUCTS.length} platform products for ${PLATFORM_ARTIST_NAME}`,
    );
  }
}
