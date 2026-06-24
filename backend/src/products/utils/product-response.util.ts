import { Product } from '../entities/product.entity';
import { Artist } from '../../artists/entities/artist.entity';
import { ProductChangeProposal } from '../entities/product-change-proposal.entity';

function toNumber(value: number | string | null | undefined): number | null {
  if (value === null || value === undefined) {
    return null;
  }
  return typeof value === 'number' ? value : parseFloat(value);
}

function resolveProductImages(product: Product): string[] {
  if (product.images?.length) {
    return product.images;
  }
  return product.image ? [product.image] : [];
}

export function toArtistSummary(artist: Artist) {
  return {
    displayName: artist.displayName,
    slug: artist.slug,
  };
}

export function toProposalResponse(proposal: ProductChangeProposal) {
  return {
    id: proposal.id,
    changes: proposal.changes,
    status: proposal.status,
    artistMessage: proposal.artistMessage,
    createdAt: proposal.createdAt,
    resolvedAt: proposal.resolvedAt,
  };
}

export function toPublicProductResponse(
  product: Product,
  effectiveStockQuantity?: number,
) {
  const images = resolveProductImages(product);
  const stockQuantity =
    effectiveStockQuantity !== undefined
      ? effectiveStockQuantity
      : product.stockQuantity;
  const inStock = product.inStock && stockQuantity > 0;

  return {
    id: product.id,
    title: product.title,
    description: product.description,
    price: toNumber(product.price) ?? 0,
    image: images[0] ?? product.image,
    images,
    inStock,
    isSet: product.isSet,
    stockQuantity,
    category: product.category,
    material: product.material,
    capacity: product.capacity,
    dimensions: product.dimensions,
    dishwasherSafe: product.dishwasherSafe,
    microwaveSafe: product.microwaveSafe,
    datePublished: product.datePublished,
    popularity: product.popularity,
    discount: product.discount,
    reviewsCount: product.reviewsCount,
    priceBeforeDiscount: toNumber(product.priceBeforeDiscount),
    artist: product.artist ? toArtistSummary(product.artist) : undefined,
  };
}

export function toAdminProductResponse(
  product: Product,
  pendingProposal?: ProductChangeProposal | null,
) {
  const images = resolveProductImages(product);

  return {
    id: product.id,
    title: product.title,
    description: product.description,
    price: toNumber(product.price) ?? 0,
    image: images[0] ?? product.image,
    images,
    inStock: product.inStock,
    isSet: product.isSet,
    stockQuantity: product.stockQuantity,
    category: product.category,
    material: product.material,
    capacity: product.capacity,
    dimensions: product.dimensions,
    dishwasherSafe: product.dishwasherSafe,
    microwaveSafe: product.microwaveSafe,
    datePublished: product.datePublished,
    popularity: product.popularity,
    discount: product.discount,
    reviewsCount: product.reviewsCount,
    priceBeforeDiscount: toNumber(product.priceBeforeDiscount),
    artistId: product.artistId,
    status: product.status,
    rejectionReason: product.rejectionReason,
    reviewedAt: product.reviewedAt,
    createdAt: product.createdAt,
    updatedAt: product.updatedAt,
    artist: product.artist ? toArtistSummary(product.artist) : undefined,
    pendingProposal: pendingProposal
      ? toProposalResponse(pendingProposal)
      : null,
  };
}
