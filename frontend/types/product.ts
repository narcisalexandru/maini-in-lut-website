export type ProductStatus =
  | "DRAFT"
  | "PENDING_REVIEW"
  | "PENDING_ARTIST_CONFIRMATION"
  | "APPROVED"
  | "REJECTED";

export interface ProductArtist {
  displayName: string;
  slug: string;
}

export interface PublicProduct {
  id: number;
  title: string;
  description: string;
  price: number;
  image: string;
  images?: string[];
  inStock: boolean;
  isSet?: boolean;
  stockQuantity?: number;
  category: string;
  material?: string | null;
  capacity?: string | null;
  dimensions?: string | null;
  dishwasherSafe?: boolean;
  microwaveSafe?: boolean;
  datePublished: string | null;
  popularity: number;
  discount: number;
  reviewsCount: number;
  priceBeforeDiscount: number | null;
  artist?: ProductArtist;
}

export interface ProductChangeProposal {
  id: number;
  changes: Partial<PublicProduct>;
  status: string;
  artistMessage: string | null;
  createdAt: string;
  resolvedAt: string | null;
}

export interface AdminProduct extends PublicProduct {
  artistId: number;
  status: ProductStatus;
  rejectionReason: string | null;
  reviewedAt: string | null;
  createdAt: string;
  updatedAt: string;
  pendingProposal: ProductChangeProposal | null;
}
