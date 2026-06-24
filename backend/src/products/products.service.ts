import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Product } from './entities/product.entity';
import {
  ProductChangeProposal,
  ProductProposalChanges,
} from './entities/product-change-proposal.entity';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { ProductStatus } from '../common/enums/product-status.enum';
import { ProposalStatus } from '../common/enums/proposal-status.enum';
import { ArtistStatus } from '../common/enums/artist-status.enum';
import { UserRole } from '../common/enums/user-role.enum';
import { ArtistsService } from '../artists/artists.service';
import { User } from '../users/entities/user.entity';
import { SeedProductInput } from './data/seed-products.data';

const EDITABLE_STATUSES = new Set<ProductStatus>([
  ProductStatus.DRAFT,
  ProductStatus.REJECTED,
]);

@Injectable()
export class ProductsService {
  constructor(
    @InjectRepository(Product)
    private readonly productsRepository: Repository<Product>,
    @InjectRepository(ProductChangeProposal)
    private readonly proposalsRepository: Repository<ProductChangeProposal>,
    private readonly artistsService: ArtistsService,
  ) {}

  async findAllPublic(): Promise<Product[]> {
    return this.productsRepository
      .createQueryBuilder('product')
      .innerJoinAndSelect('product.artist', 'artist')
      .where('product.status = :status', { status: ProductStatus.APPROVED })
      .andWhere('artist.status = :artistStatus', {
        artistStatus: ArtistStatus.APPROVED,
      })
      .orderBy('product.datePublished', 'DESC')
      .addOrderBy('product.id', 'ASC')
      .getMany();
  }

  async findOnePublic(id: number): Promise<Product | null> {
    return this.productsRepository
      .createQueryBuilder('product')
      .innerJoinAndSelect('product.artist', 'artist')
      .where('product.id = :id', { id })
      .andWhere('product.status = :status', { status: ProductStatus.APPROVED })
      .andWhere('artist.status = :artistStatus', {
        artistStatus: ArtistStatus.APPROVED,
      })
      .getOne();
  }

  async findOnePurchasable(id: number): Promise<Product | null> {
    return this.findOnePublic(id);
  }

  /** @deprecated Use findOnePurchasable for storefront flows */
  async findOne(id: number): Promise<Product | null> {
    return this.findOnePurchasable(id);
  }

  async findAllForAdmin(
    user: User,
    status?: ProductStatus,
    artistId?: number,
  ): Promise<Product[]> {
    const qb = this.productsRepository
      .createQueryBuilder('product')
      .innerJoinAndSelect('product.artist', 'artist')
      .orderBy('product.updatedAt', 'DESC');

    if (status) {
      qb.andWhere('product.status = :status', { status });
    }

    if (user.role === UserRole.ARTIST) {
      const artist = await this.artistsService.findApprovedByUserId(user.id);
      if (!artist) {
        throw new ForbiddenException('Approved artist profile required');
      }
      qb.andWhere('product.artistId = :artistId', { artistId: artist.id });
    } else if (user.role === UserRole.SUPER_ADMIN) {
      if (artistId) {
        qb.andWhere('product.artistId = :filterArtistId', {
          filterArtistId: artistId,
        });
      }
    } else {
      throw new ForbiddenException('Insufficient permissions');
    }

    return qb.getMany();
  }

  async findReviewQueue(): Promise<Product[]> {
    return this.productsRepository.find({
      where: { status: ProductStatus.PENDING_REVIEW },
      relations: ['artist'],
      order: { createdAt: 'ASC' },
    });
  }

  async findOneForAdmin(user: User, id: number): Promise<Product> {
    const product = await this.productsRepository.findOne({
      where: { id },
      relations: ['artist'],
    });

    if (!product) {
      throw new NotFoundException(`Product with ID ${id} not found`);
    }

    this.assertCanManageProduct(user, product);
    return product;
  }

  async getPendingProposal(
    productId: number,
  ): Promise<ProductChangeProposal | null> {
    return this.proposalsRepository.findOne({
      where: { productId, status: ProposalStatus.PENDING },
    });
  }

  async createForArtist(
    userId: number,
    dto: CreateProductDto,
  ): Promise<Product> {
    const artist = await this.artistsService.findApprovedByUserId(userId);
    if (!artist) {
      throw new ForbiddenException('Approved artist profile required');
    }

    const product = this.productsRepository.create({
      ...this.mapProductInput(dto),
      artistId: artist.id,
      status: ProductStatus.DRAFT,
    });

    return this.productsRepository.save(product);
  }

  async updateForArtist(
    userId: number,
    id: number,
    dto: UpdateProductDto,
  ): Promise<Product> {
    const product = await this.getEditableProductForArtist(userId, id);
    Object.assign(product, this.mapProductInput(dto));
    return this.productsRepository.save(product);
  }

  async submitForReview(userId: number, id: number): Promise<Product> {
    const product = await this.getEditableProductForArtist(userId, id);

    if (!EDITABLE_STATUSES.has(product.status)) {
      throw new BadRequestException(
        'Only draft or rejected products can be submitted for review',
      );
    }

    product.status = ProductStatus.PENDING_REVIEW;
    product.rejectionReason = null;
    product.reviewedAt = null;
    product.reviewedById = null;

    return this.productsRepository.save(product);
  }

  async approve(id: number, reviewerId: number): Promise<Product> {
    const product = await this.findProductById(id);

    if (product.status !== ProductStatus.PENDING_REVIEW) {
      throw new BadRequestException(
        'Only products pending review can be approved directly',
      );
    }

    product.status = ProductStatus.APPROVED;
    product.rejectionReason = null;
    product.reviewedAt = new Date();
    product.reviewedById = reviewerId;
    product.datePublished = product.datePublished ?? new Date();

    return this.productsRepository.save(product);
  }

  async reject(
    id: number,
    reviewerId: number,
    reason: string,
  ): Promise<Product> {
    const product = await this.findProductById(id);

    if (product.status !== ProductStatus.PENDING_REVIEW) {
      throw new BadRequestException(
        'Only products pending review can be rejected',
      );
    }

    product.status = ProductStatus.REJECTED;
    product.rejectionReason = reason.trim();
    product.reviewedAt = new Date();
    product.reviewedById = reviewerId;

    return this.productsRepository.save(product);
  }

  async proposeChanges(
    id: number,
    reviewerId: number,
    changes: ProductProposalChanges,
  ): Promise<Product> {
    const sanitizedChanges = this.sanitizeProposalChanges(changes);
    if (Object.keys(sanitizedChanges).length === 0) {
      throw new BadRequestException('At least one field must be changed');
    }

    const product = await this.findProductById(id);

    if (
      product.status !== ProductStatus.PENDING_REVIEW &&
      product.status !== ProductStatus.APPROVED
    ) {
      throw new BadRequestException(
        'Changes can only be proposed for products in review or already published',
      );
    }

    const existingProposal = await this.getPendingProposal(id);
    if (existingProposal) {
      throw new ConflictException('A pending change proposal already exists');
    }

    const proposal = this.proposalsRepository.create({
      productId: id,
      proposedById: reviewerId,
      changes: sanitizedChanges,
      status: ProposalStatus.PENDING,
    });

    await this.proposalsRepository.save(proposal);

    product.status = ProductStatus.PENDING_ARTIST_CONFIRMATION;
    product.reviewedAt = new Date();
    product.reviewedById = reviewerId;

    return this.productsRepository.save(product);
  }

  async acceptChanges(userId: number, id: number): Promise<Product> {
    const product = await this.getProductAwaitingArtistConfirmation(userId, id);
    const proposal = await this.getPendingProposalOrFail(id);

    Object.assign(product, this.mapProposalToProductFields(proposal.changes));
    product.status = ProductStatus.APPROVED;
    product.datePublished = product.datePublished ?? new Date();

    proposal.status = ProposalStatus.ACCEPTED;
    proposal.resolvedAt = new Date();

    await this.proposalsRepository.save(proposal);
    return this.productsRepository.save(product);
  }

  async rejectChanges(
    userId: number,
    id: number,
    message?: string,
  ): Promise<Product> {
    const product = await this.getProductAwaitingArtistConfirmation(userId, id);
    const proposal = await this.getPendingProposalOrFail(id);

    proposal.status = ProposalStatus.REJECTED;
    proposal.artistMessage = message?.trim() || null;
    proposal.resolvedAt = new Date();

    product.status =
      product.datePublished === null
        ? ProductStatus.DRAFT
        : ProductStatus.APPROVED;

    await this.proposalsRepository.save(proposal);
    return this.productsRepository.save(product);
  }

  async countAll(): Promise<number> {
    return this.productsRepository.count();
  }

  async seedPlatformProducts(
    artistId: number,
    products: SeedProductInput[],
  ): Promise<void> {
    const entities = products.map((product) =>
      this.productsRepository.create({
        title: product.title,
        description: product.description,
        price: product.price,
        image: product.image,
        inStock: product.inStock,
        category: product.category,
        datePublished: product.datePublished,
        popularity: product.popularity,
        discount: product.discount,
        reviewsCount: product.reviewsCount,
        priceBeforeDiscount: product.priceBeforeDiscount,
        artistId,
        status: ProductStatus.APPROVED,
      }),
    );

    await this.productsRepository.save(entities);
  }

  private async getEditableProductForArtist(
    userId: number,
    id: number,
  ): Promise<Product> {
    const artist = await this.artistsService.findApprovedByUserId(userId);
    if (!artist) {
      throw new ForbiddenException('Approved artist profile required');
    }

    const product = await this.findProductById(id);
    if (product.artistId !== artist.id) {
      throw new ForbiddenException('You can only manage your own products');
    }

    if (!EDITABLE_STATUSES.has(product.status)) {
      throw new BadRequestException(
        'Only draft or rejected products can be edited',
      );
    }

    return product;
  }

  private async getProductAwaitingArtistConfirmation(
    userId: number,
    id: number,
  ): Promise<Product> {
    const artist = await this.artistsService.findApprovedByUserId(userId);
    if (!artist) {
      throw new ForbiddenException('Approved artist profile required');
    }

    const product = await this.findProductById(id);
    if (product.artistId !== artist.id) {
      throw new ForbiddenException('You can only manage your own products');
    }

    if (product.status !== ProductStatus.PENDING_ARTIST_CONFIRMATION) {
      throw new BadRequestException('No pending changes require confirmation');
    }

    return product;
  }

  private async getPendingProposalOrFail(
    productId: number,
  ): Promise<ProductChangeProposal> {
    const proposal = await this.getPendingProposal(productId);
    if (!proposal) {
      throw new NotFoundException('Pending change proposal not found');
    }
    return proposal;
  }

  private async findProductById(id: number): Promise<Product> {
    const product = await this.productsRepository.findOne({
      where: { id },
      relations: ['artist'],
    });

    if (!product) {
      throw new NotFoundException(`Product with ID ${id} not found`);
    }

    return product;
  }

  private assertCanManageProduct(user: User, product: Product): void {
    if (user.role === UserRole.SUPER_ADMIN) {
      return;
    }

    if (user.role === UserRole.ARTIST) {
      if (product.artist?.userId !== user.id) {
        throw new ForbiddenException('You can only access your own products');
      }
      return;
    }

    throw new ForbiddenException('Insufficient permissions');
  }

  private mapProductInput(
    dto: CreateProductDto | UpdateProductDto,
  ): Partial<Product> {
    const mapped: Partial<Product> = {};

    if (dto.title !== undefined) mapped.title = dto.title.trim();
    if (dto.description !== undefined) mapped.description = dto.description.trim();
    if (dto.price !== undefined) mapped.price = dto.price;
    if (dto.images !== undefined) {
      const images = dto.images.map((url) => url.trim()).filter(Boolean).slice(0, 3);
      if (images.length === 0) {
        throw new BadRequestException('At least one product image is required');
      }
      mapped.images = images;
      mapped.image = images[0];
    } else if ('image' in dto && typeof dto.image === 'string' && dto.image.trim()) {
      const image = dto.image.trim();
      mapped.image = image;
      mapped.images = [image];
    }
    if (dto.category !== undefined) mapped.category = dto.category.trim();
    if (dto.material !== undefined) {
      mapped.material = dto.material?.trim() || null;
    }
    if (dto.capacity !== undefined) {
      mapped.capacity = dto.capacity?.trim() || null;
    }
    if (dto.dimensions !== undefined) {
      mapped.dimensions = dto.dimensions?.trim() || null;
    }
    if (dto.dishwasherSafe !== undefined) {
      mapped.dishwasherSafe = dto.dishwasherSafe;
    }
    if (dto.microwaveSafe !== undefined) {
      mapped.microwaveSafe = dto.microwaveSafe;
    }
    if (dto.inStock !== undefined) mapped.inStock = dto.inStock;
    if (dto.isSet !== undefined) mapped.isSet = dto.isSet;
    if (dto.stockQuantity !== undefined) {
      mapped.stockQuantity = dto.stockQuantity;
      if (dto.inStock === undefined) {
        mapped.inStock = dto.stockQuantity > 0;
      }
    }
    if (dto.discount !== undefined) mapped.discount = dto.discount;
    if (dto.priceBeforeDiscount !== undefined) {
      mapped.priceBeforeDiscount = dto.priceBeforeDiscount;
    }

    return mapped;
  }

  private sanitizeProposalChanges(
    changes: ProductProposalChanges,
  ): ProductProposalChanges {
    const allowedKeys: (keyof ProductProposalChanges)[] = [
      'title',
      'description',
      'price',
      'image',
      'images',
      'category',
      'material',
      'capacity',
      'dimensions',
      'dishwasherSafe',
      'microwaveSafe',
      'inStock',
      'isSet',
      'stockQuantity',
      'discount',
      'priceBeforeDiscount',
    ];

    const sanitized: ProductProposalChanges = {};
    for (const key of allowedKeys) {
      const value = changes[key];
      if (value !== undefined) {
        (sanitized as Record<string, unknown>)[key] = value;
      }
    }

    return sanitized;
  }

  private mapProposalToProductFields(
    changes: ProductProposalChanges,
  ): Partial<Product> {
    return this.mapProductInput(changes as UpdateProductDto);
  }
}
