import { ArtistStatus } from '../common/enums/artist-status.enum';

export type InboxRecipient = {
  id: number;
  userId: number | null;
  status: ArtistStatus;
};

export function inboxRecipients(artists: InboxRecipient[]): InboxRecipient[] {
  return artists.filter(
    (artist) =>
      artist.userId !== null &&
      (artist.status === ArtistStatus.APPROVED ||
        artist.status === ArtistStatus.SUSPENDED),
  );
}
