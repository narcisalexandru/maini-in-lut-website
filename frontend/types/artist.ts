export type ArtistStatus =
  | "PENDING"
  | "APPROVED"
  | "REJECTED"
  | "SUSPENDED";

export interface ArtistApplicationFields {
  artistFirstName: string | null;
  artistLastName: string | null;
  companyCui: string | null;
  companyLegalName: string | null;
  contactEmail: string | null;
  contactPhone: string | null;
}

export interface ArtistApplication extends ArtistApplicationFields {
  id: number;
  displayName: string;
  slug: string;
  description: string;
  portfolioUrl: string | null;
  status: ArtistStatus;
  rejectionReason: string | null;
  suspensionReason: string | null;
  suspensionNoticeDismissedAt: string | null;
  lastReactivatedAt: string | null;
  reactivationNoticeDismissedAt: string | null;
  reviewedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ArtistApplyPayload {
  artistFirstName: string;
  artistLastName: string;
  companyCui: string;
  companyLegalName: string;
  displayName: string;
  contactEmail: string;
  contactPhone?: string;
  portfolioUrl?: string;
}

export interface PublicArtist {
  id: number;
  displayName: string;
  slug: string;
  description: string;
  portfolioUrl: string | null;
  logo: string | null;
  coverImage: string | null;
}

export interface AdminArtist extends ArtistApplication {
  user?: {
    id: number;
    first_name: string;
    last_name: string;
    email: string;
    phone: string | null;
  };
}
