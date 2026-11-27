import { ArtistStatus } from '../common/enums/artist-status.enum';
import { inboxRecipients } from './inbox-recipients.util';

describe('inboxRecipients', () => {
  it('keeps approved and suspended artists who can sign in', () => {
    const recipients = inboxRecipients([
      { id: 1, userId: 10, status: ArtistStatus.APPROVED },
      { id: 2, userId: null, status: ArtistStatus.APPROVED },
      { id: 3, userId: 11, status: ArtistStatus.PENDING },
      { id: 4, userId: 12, status: ArtistStatus.SUSPENDED },
      { id: 5, userId: 13, status: ArtistStatus.REJECTED },
    ]);

    expect(recipients.map((artist) => artist.id)).toEqual([1, 4]);
  });
});
