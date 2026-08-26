import { Artist } from '../entities/artist.entity';
import { User } from '../../users/entities/user.entity';

export function toArtistUserSummary(user: User) {
  return {
    id: user.id,
    first_name: user.first_name,
    last_name: user.last_name,
    email: user.email,
    phone: user.phone ?? null,
  };
}

export function toArtistApplicationFields(artist: Artist) {
  return {
    artistFirstName: artist.artistFirstName,
    artistLastName: artist.artistLastName,
    companyCui: artist.companyCui,
    companyLegalName: artist.companyLegalName,
    contactEmail: artist.contactEmail,
    contactPhone: artist.contactPhone,
  };
}

export function toArtistResponse(artist: Artist, includeUser = false) {
  return {
    id: artist.id,
    displayName: artist.displayName,
    slug: artist.slug,
    description: artist.description,
    portfolioUrl: artist.portfolioUrl,
    logo: artist.logo,
    coverImage: artist.coverImage,
    status: artist.status,
    rejectionReason: artist.rejectionReason,
    suspensionReason: artist.suspensionReason,
    suspensionNoticeDismissedAt: artist.suspensionNoticeDismissedAt,
    lastReactivatedAt: artist.lastReactivatedAt,
    reactivationNoticeDismissedAt: artist.reactivationNoticeDismissedAt,
    reviewedAt: artist.reviewedAt,
    createdAt: artist.createdAt,
    updatedAt: artist.updatedAt,
    ...toArtistApplicationFields(artist),
    ...(includeUser && artist.user
      ? { user: toArtistUserSummary(artist.user) }
      : {}),
  };
}

export function toPublicArtistResponse(artist: Artist) {
  return {
    id: artist.id,
    displayName: artist.displayName,
    slug: artist.slug,
    description: artist.description,
    portfolioUrl: artist.portfolioUrl,
    logo: artist.logo,
    coverImage: artist.coverImage,
  };
}
