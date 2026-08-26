import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository, In } from 'typeorm';
import { UserCartItem } from '../cart/entities/user-cart-item.entity';
import { UserFavorite } from '../favorites/entities/user-favorite.entity';
import { StockReservation } from '../stock-reservations/entities/stock-reservation.entity';
import { Product } from './entities/product.entity';
import {
  ProductChangeProposal,
  ProductProposalChanges,
} from './entities/product-change-proposal.entity';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { AdminUpdateProductDto } from './dto/admin-update-product.dto';
import { SaveProductDraftDto } from './dto/save-product-draft.dto';
import { ReviewProductChangesAction } from './dto/review-product-changes.dto';
import { ProductStatus } from '../common/enums/product-status.enum';
import { ProposalStatus } from '../common/enums/proposal-status.enum';
import { ArtistStatus } from '../common/enums/artist-status.enum';
import { UserRole } from '../common/enums/user-role.enum';
import { ArtistsService } from '../artists/artists.service';
import { UsersService } from '../users/users.service';
import { EmailService } from '../email/email.service';
import { User } from '../users/entities/user.entity';
import { SeedProductInput } from './data/seed-products.data';
import { buildProductChangeEmailItems } from './utils/product-change-email.util';

const EDITABLE_STATUSES = new Set<ProductStatus>([
  ProductStatus.DRAFT,
  ProductStatus.REJECTED,
]);

const DRAFT_PLACEHOLDER_IMAGE = '/images/logo.png';
const DRAFT_DEFAULT_TITLE = 'Ciornă';
const DRAFT_DEFAULT_DESCRIPTION = 'Descriere în lucru';
const DRAFT_DEFAULT_CATEGORY = 'Necategorizat';
const DRAFT_DEFAULT_PRICE = 0.01;

@Injectable()
export class ProductsService {
  private readonly logger = new Logger(ProductsService.name);

  constructor(
    @InjectRepository(Product)
    private readonly productsRepository: Repository<Product>,
    @InjectRepository(ProductChangeProposal)
    private readonly proposalsRepository: Repository<ProductChangeProposal>,
    private readonly artistsService: ArtistsService,
    private readonly usersService: UsersService,
    private readonly emailService: EmailService,
    private readonly configService: ConfigService,
    @InjectDataSource()
    private readonly dataSource: DataSource,
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
      where: {
        status: In([
          ProductStatus.PENDING_REVIEW,
          ProductStatus.PENDING_UPDATE_REVIEW,
        ]),
      },
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

  async updateForSuperAdmin(
    reviewerId: number,
    id: number,
    dto: AdminUpdateProductDto,
  ): Promise<Product> {
    const product = await this.findProductById(id);
    const hasUpdates =
      Object.keys(dto).length > 0 &&
      Object.values(dto).some((value) => value !== undefined);

    if (!hasUpdates) {
      throw new BadRequestException('At least one field must be provided');
    }

    Object.assign(product, this.mapProductInput(dto));
    this.applyAdminProductFields(product, dto);

    const pendingProposal = await this.getPendingProposal(id);
    if (pendingProposal) {
      pendingProposal.status = ProposalStatus.REJECTED;
      pendingProposal.artistMessage = 'Modificat direct de super-admin';
      pendingProposal.resolvedAt = new Date();
      await this.proposalsRepository.save(pendingProposal);

      if (
        product.status === ProductStatus.PENDING_UPDATE_REVIEW &&
        dto.status === undefined
      ) {
        product.status = ProductStatus.APPROVED;
      }
    }

    product.reviewedAt = new Date();
    product.reviewedById = reviewerId;

    return this.productsRepository.save(product);
  }

  async findActiveDraftForArtist(userId: number): Promise<Product | null> {
    const artist = await this.artistsService.findApprovedByUserId(userId);
    if (!artist) {
      throw new ForbiddenException('Approved artist profile required');
    }

    const drafts = await this.productsRepository.find({
      where: { artistId: artist.id, status: ProductStatus.DRAFT },
      order: { updatedAt: 'DESC' },
    });

    return drafts.find((product) => !this.isProductDraftComplete(product)) ?? null;
  }

  async saveDraftForArtist(
    userId: number,
    dto: SaveProductDraftDto,
  ): Promise<Product> {
    if (dto.id) {
      const product = await this.getEditableProductForArtist(userId, dto.id);
      if (product.status !== ProductStatus.DRAFT) {
        throw new BadRequestException('Only draft products can be auto-saved');
      }
      Object.assign(product, this.mapDraftProductInput(dto, false));
      return this.productsRepository.save(product);
    }

    const artist = await this.artistsService.findApprovedByUserId(userId);
    if (!artist) {
      throw new ForbiddenException('Approved artist profile required');
    }

    const product = this.productsRepository.create({
      ...this.mapDraftProductInput(dto, true),
      artistId: artist.id,
      status: ProductStatus.DRAFT,
    });

    return this.productsRepository.save(product);
  }

  async deleteDraftForArtist(userId: number, id: number): Promise<void> {
    const product = await this.getEditableProductForArtist(userId, id);
    if (product.status !== ProductStatus.DRAFT) {
      throw new BadRequestException('Only draft products can be deleted');
    }
    await this.removeProductAndRelatedData(product.id);
  }

  async deleteForAdmin(user: User, id: number): Promise<void> {
    const product = await this.findProductById(id);
    this.assertCanManageProduct(user, product);
    await this.removeProductAndRelatedData(id);
  }

  private async removeProductAndRelatedData(productId: number): Promise<void> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      await queryRunner.manager.delete(UserCartItem, { productId });
      await queryRunner.manager.delete(UserFavorite, { productId });
      await queryRunner.manager.delete(StockReservation, { productId });
      await queryRunner.manager.delete(Product, { id: productId });
      await queryRunner.commitTransaction();
    } catch (error) {
      await queryRunner.rollbackTransaction();
      this.logger.error(
        `Failed to delete product ${productId}`,
        error instanceof Error ? error.stack : String(error),
      );
      throw new BadRequestException('Failed to delete product');
    } finally {
      await queryRunner.release();
    }
  }

  async submitChangeRequestForArtist(
    userId: number,
    id: number,
    dto: UpdateProductDto,
  ): Promise<Product> {
    const artist = await this.artistsService.findApprovedByUserId(userId);
    if (!artist) {
      throw new ForbiddenException('Approved artist profile required');
    }

    const product = await this.findProductById(id);
    if (product.artistId !== artist.id) {
      throw new ForbiddenException('You can only manage your own products');
    }

    if (product.status !== ProductStatus.APPROVED) {
      throw new BadRequestException(
        'Only approved products can be updated through change requests',
      );
    }

    const changes = this.computeProductChanges(product, dto);
    if (Object.keys(changes).length === 0) {
      throw new BadRequestException('At least one field must be changed');
    }

    await this.upsertPendingProposal(id, userId, changes);

    product.status = ProductStatus.PENDING_UPDATE_REVIEW;
    product.reviewedAt = null;
    product.reviewedById = null;

    const savedProduct = await this.productsRepository.save(product);
    await this.notifySuperAdminsOfProductChangeRequest(
      savedProduct,
      artist.displayName,
      changes,
    );

    return savedProduct;
  }

  async submitForReview(userId: number, id: number): Promise<Product> {
    const product = await this.getEditableProductForArtist(userId, id);

    if (!EDITABLE_STATUSES.has(product.status)) {
      throw new BadRequestException(
        'Only draft or rejected products can be submitted for review',
      );
    }

    if (!this.isProductDraftComplete(product)) {
      throw new BadRequestException(
        'Complete all required product fields before submitting for review',
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

    if (product.status === ProductStatus.PENDING_REVIEW) {
      product.status = ProductStatus.APPROVED;
      product.rejectionReason = null;
      product.reviewedAt = new Date();
      product.reviewedById = reviewerId;
      product.datePublished = product.datePublished ?? new Date();
      return this.productsRepository.save(product);
    }

    if (product.status === ProductStatus.PENDING_UPDATE_REVIEW) {
      const proposal = await this.getPendingProposalOrFail(id);
      Object.assign(product, this.mapProposalToProductFields(proposal.changes));
      product.status = ProductStatus.APPROVED;
      product.rejectionReason = null;
      product.reviewedAt = new Date();
      product.reviewedById = reviewerId;
      product.datePublished = product.datePublished ?? new Date();

      proposal.status = ProposalStatus.ACCEPTED;
      proposal.resolvedAt = new Date();
      await this.proposalsRepository.save(proposal);
      return this.productsRepository.save(product);
    }

    throw new BadRequestException(
      'Only products pending review can be approved',
    );
  }

  async reject(
    id: number,
    reviewerId: number,
    reason: string,
  ): Promise<Product> {
    const product = await this.findProductById(id);

    if (product.status === ProductStatus.PENDING_REVIEW) {
      product.status = ProductStatus.REJECTED;
      product.rejectionReason = reason.trim();
      product.reviewedAt = new Date();
      product.reviewedById = reviewerId;
      return this.productsRepository.save(product);
    }

    if (product.status === ProductStatus.PENDING_UPDATE_REVIEW) {
      const proposal = await this.getPendingProposalOrFail(id);
      proposal.status = ProposalStatus.REJECTED;
      proposal.artistMessage = reason.trim();
      proposal.resolvedAt = new Date();
      product.status = ProductStatus.APPROVED;
      product.rejectionReason = null;
      product.reviewedAt = new Date();
      product.reviewedById = reviewerId;
      await this.proposalsRepository.save(proposal);
      return this.productsRepository.save(product);
    }

    throw new BadRequestException(
      'Only products pending review can be rejected',
    );
  }

  async reviewProductChanges(
    id: number,
    reviewerId: number,
    action: ReviewProductChangesAction,
    fields?: string[],
    reason?: string,
  ): Promise<Product> {
    switch (action) {
      case ReviewProductChangesAction.ACCEPT_ALL:
        return this.approve(id, reviewerId);
      case ReviewProductChangesAction.REJECT_ALL:
        return this.reject(id, reviewerId, reason?.trim() || '');
      case ReviewProductChangesAction.ACCEPT_FIELDS:
        return this.acceptProposalFields(id, reviewerId, fields ?? []);
      case ReviewProductChangesAction.REJECT_FIELDS:
        return this.rejectProposalFields(id, reviewerId, fields ?? []);
      default:
        throw new BadRequestException('Unsupported review action');
    }
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

    await this.upsertPendingProposal(id, reviewerId, sanitizedChanges);

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

  private async upsertPendingProposal(
    productId: number,
    proposedById: number,
    changes: ProductProposalChanges,
  ): Promise<ProductChangeProposal> {
    const existing = await this.proposalsRepository.findOne({
      where: { productId },
    });

    if (existing?.status === ProposalStatus.PENDING) {
      throw new ConflictException('A pending change proposal already exists');
    }

    if (existing) {
      existing.proposedById = proposedById;
      existing.changes = changes;
      existing.status = ProposalStatus.PENDING;
      existing.artistMessage = null;
      existing.resolvedAt = null;
      return this.proposalsRepository.save(existing);
    }

    const proposal = this.proposalsRepository.create({
      productId,
      proposedById,
      changes,
      status: ProposalStatus.PENDING,
    });

    return this.proposalsRepository.save(proposal);
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

  private applyAdminProductFields(
    product: Product,
    dto: AdminUpdateProductDto,
  ): void {
    if (dto.popularity !== undefined) {
      product.popularity = dto.popularity;
    }
    if (dto.reviewsCount !== undefined) {
      product.reviewsCount = dto.reviewsCount;
    }
    if (dto.datePublished !== undefined) {
      product.datePublished =
        dto.datePublished === null || dto.datePublished === ''
          ? null
          : new Date(dto.datePublished);
    }
    if (dto.status !== undefined) {
      product.status = dto.status;
      if (
        dto.status === ProductStatus.APPROVED &&
        product.datePublished === null &&
        dto.datePublished === undefined
      ) {
        product.datePublished = new Date();
      }
    }
  }

  private isPlaceholderImage(image: string | null | undefined): boolean {
    if (!image) return true;
    return image === DRAFT_PLACEHOLDER_IMAGE;
  }

  private isProductDraftComplete(product: Product): boolean {
    const images = product.images?.length
      ? product.images
      : product.image
        ? [product.image]
        : [];
    const hasRealImage = images.some((img) => !this.isPlaceholderImage(img));

    return (
      product.title.trim().length >= 2 &&
      product.description.trim().length >= 10 &&
      Number(product.price) >= 0.01 &&
      hasRealImage &&
      product.category.trim().length > 0
    );
  }

  private mapDraftProductInput(
    dto: SaveProductDraftDto,
    forCreate: boolean,
  ): Partial<Product> {
    const mapped: Partial<Product> = {};

    if (dto.title !== undefined) {
      mapped.title = dto.title.trim() || DRAFT_DEFAULT_TITLE;
    } else if (forCreate) {
      mapped.title = DRAFT_DEFAULT_TITLE;
    }

    if (dto.description !== undefined) {
      mapped.description = dto.description.trim() || DRAFT_DEFAULT_DESCRIPTION;
    } else if (forCreate) {
      mapped.description = DRAFT_DEFAULT_DESCRIPTION;
    }

    if (dto.price !== undefined) {
      mapped.price =
        dto.price > 0 ? dto.price : forCreate ? DRAFT_DEFAULT_PRICE : dto.price;
    } else if (forCreate) {
      mapped.price = DRAFT_DEFAULT_PRICE;
    }

    if (dto.images !== undefined) {
      const images = dto.images
        .map((url) => url.trim())
        .filter(Boolean)
        .slice(0, 3);
      if (images.length > 0) {
        mapped.images = images;
        mapped.image = images[0];
      } else if (forCreate) {
        mapped.image = DRAFT_PLACEHOLDER_IMAGE;
        mapped.images = null;
      }
    } else if (forCreate) {
      mapped.image = DRAFT_PLACEHOLDER_IMAGE;
      mapped.images = null;
    }

    if (dto.category !== undefined) {
      mapped.category = dto.category.trim() || DRAFT_DEFAULT_CATEGORY;
    } else if (forCreate) {
      mapped.category = DRAFT_DEFAULT_CATEGORY;
    }

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

    return mapped;
  }

  private computeProductChanges(
    product: Product,
    dto: UpdateProductDto,
  ): ProductProposalChanges {
    const proposed = this.mapProductInput(dto);
    const changes: ProductProposalChanges = {};

    if (dto.title !== undefined && proposed.title !== product.title) {
      changes.title = proposed.title;
    }
    if (
      dto.description !== undefined &&
      proposed.description !== product.description
    ) {
      changes.description = proposed.description;
    }
    if (
      dto.price !== undefined &&
      Number(proposed.price) !== Number(product.price)
    ) {
      changes.price = proposed.price;
    }
    if (dto.category !== undefined && proposed.category !== product.category) {
      changes.category = proposed.category;
    }
    if (dto.material !== undefined && proposed.material !== product.material) {
      changes.material = proposed.material;
    }
    if (dto.capacity !== undefined && proposed.capacity !== product.capacity) {
      changes.capacity = proposed.capacity;
    }
    if (
      dto.dimensions !== undefined &&
      proposed.dimensions !== product.dimensions
    ) {
      changes.dimensions = proposed.dimensions;
    }
    if (
      dto.dishwasherSafe !== undefined &&
      proposed.dishwasherSafe !== product.dishwasherSafe
    ) {
      changes.dishwasherSafe = proposed.dishwasherSafe;
    }
    if (
      dto.microwaveSafe !== undefined &&
      proposed.microwaveSafe !== product.microwaveSafe
    ) {
      changes.microwaveSafe = proposed.microwaveSafe;
    }
    if (dto.inStock !== undefined && proposed.inStock !== product.inStock) {
      changes.inStock = proposed.inStock;
    }
    if (dto.isSet !== undefined && proposed.isSet !== product.isSet) {
      changes.isSet = proposed.isSet;
    }
    if (
      dto.stockQuantity !== undefined &&
      proposed.stockQuantity !== product.stockQuantity
    ) {
      changes.stockQuantity = proposed.stockQuantity;
    }
    if (
      dto.discount !== undefined &&
      Number(proposed.discount) !== Number(product.discount)
    ) {
      changes.discount = proposed.discount;
    }
    if (
      dto.priceBeforeDiscount !== undefined &&
      Number(proposed.priceBeforeDiscount) !==
        Number(product.priceBeforeDiscount)
    ) {
      changes.priceBeforeDiscount = proposed.priceBeforeDiscount;
    }

    if (dto.images !== undefined) {
      const currentImages = product.images?.length
        ? product.images
        : [product.image];
      const proposedImages = proposed.images ?? [];
      if (JSON.stringify(currentImages) !== JSON.stringify(proposedImages)) {
        changes.images = proposedImages;
        changes.image = proposedImages[0];
      }
    }

    return this.sanitizeProposalChanges(changes);
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

  private async acceptProposalFields(
    id: number,
    reviewerId: number,
    fields: string[],
  ): Promise<Product> {
    if (!fields.length) {
      throw new BadRequestException('At least one field must be provided');
    }

    const product = await this.findProductById(id);
    if (product.status !== ProductStatus.PENDING_UPDATE_REVIEW) {
      throw new BadRequestException(
        'Only pending update reviews support partial field approval',
      );
    }

    const proposal = await this.getPendingProposalOrFail(id);
    this.assertProposalHasFields(proposal.changes, fields);

    const picked = this.pickProposalFields(proposal.changes, fields);
    Object.assign(product, this.mapProposalToProductFields(picked));
    proposal.changes = this.omitProposalFields(proposal.changes, fields);

    return this.finalizeProposalReview(product, proposal, reviewerId);
  }

  private async rejectProposalFields(
    id: number,
    reviewerId: number,
    fields: string[],
  ): Promise<Product> {
    if (!fields.length) {
      throw new BadRequestException('At least one field must be provided');
    }

    const product = await this.findProductById(id);
    if (product.status !== ProductStatus.PENDING_UPDATE_REVIEW) {
      throw new BadRequestException(
        'Only pending update reviews support partial field rejection',
      );
    }

    const proposal = await this.getPendingProposalOrFail(id);
    this.assertProposalHasFields(proposal.changes, fields);
    proposal.changes = this.omitProposalFields(proposal.changes, fields);

    return this.finalizeProposalReview(product, proposal, reviewerId);
  }

  private assertProposalHasFields(
    changes: ProductProposalChanges,
    fields: string[],
  ): void {
    for (const field of fields) {
      if (!this.proposalHasField(changes, field)) {
        throw new BadRequestException(
          `No pending change found for field "${field}"`,
        );
      }
    }
  }

  private proposalHasField(
    changes: ProductProposalChanges,
    field: string,
  ): boolean {
    if (field === 'images') {
      return changes.images !== undefined || changes.image !== undefined;
    }
    return changes[field as keyof ProductProposalChanges] !== undefined;
  }

  private pickProposalFields(
    changes: ProductProposalChanges,
    fields: string[],
  ): ProductProposalChanges {
    const picked: ProductProposalChanges = {};

    for (const field of fields) {
      if (field === 'images') {
        if (changes.images !== undefined) {
          picked.images = changes.images;
          picked.image = changes.images[0];
        } else if (changes.image !== undefined) {
          picked.image = changes.image;
          picked.images = [changes.image];
        }
        continue;
      }

      const value = changes[field as keyof ProductProposalChanges];
      if (value !== undefined) {
        (picked as Record<string, unknown>)[field] = value;
      }
    }

    return this.sanitizeProposalChanges(picked);
  }

  private omitProposalFields(
    changes: ProductProposalChanges,
    fields: string[],
  ): ProductProposalChanges {
    const next: ProductProposalChanges = { ...changes };

    for (const field of fields) {
      if (field === 'images') {
        delete next.images;
        delete next.image;
        continue;
      }
      delete next[field as keyof ProductProposalChanges];
    }

    return this.sanitizeProposalChanges(next);
  }

  private hasRemainingProposalChanges(
    changes: ProductProposalChanges,
  ): boolean {
    return Object.keys(this.sanitizeProposalChanges(changes)).length > 0;
  }

  private async finalizeProposalReview(
    product: Product,
    proposal: ProductChangeProposal,
    reviewerId: number,
  ): Promise<Product> {
    product.reviewedAt = new Date();
    product.reviewedById = reviewerId;

    if (!this.hasRemainingProposalChanges(proposal.changes)) {
      proposal.status = ProposalStatus.ACCEPTED;
      proposal.resolvedAt = new Date();
      product.status = ProductStatus.APPROVED;
      product.rejectionReason = null;
      product.datePublished = product.datePublished ?? new Date();
    }

    await this.proposalsRepository.save(proposal);
    return this.productsRepository.save(product);
  }

  private async notifySuperAdminsOfProductChangeRequest(
    product: Product,
    artistName: string,
    changes: ProductProposalChanges,
  ): Promise<void> {
    try {
      const recipients = await this.usersService.findSuperAdminEmails();
      if (!recipients.length) {
        this.logger.warn(
          'No super-admin emails found for product change request notification',
        );
        return;
      }

      const frontendBase =
        this.configService.get('FRONTEND_URL') || 'http://localhost:3000';
      const payload = {
        artistName,
        productTitle: product.title,
        adminUrl: `${frontendBase}/admin/produse`,
        changeItems: buildProductChangeEmailItems(product, changes),
      };

      await Promise.all(
        recipients.map((email) =>
          this.emailService.sendProductChangeRequestNotification(email, payload),
        ),
      );
    } catch (error) {
      this.logger.error(
        'Failed to send product change request notification email',
        error instanceof Error ? error.stack : String(error),
      );
    }
  }
}
