export type InboxSenderRole = "ARTIST" | "SUPER_ADMIN" | "CLIENT";

export type InboxThreadSummary = {
  id: number;
  subject: string;
  artistId: number | null;
  artistName: string;
  broadcast: boolean;
  repliesDisabled: boolean;
  lastMessageAt: string;
  preview: string;
  hasImage: boolean;
  unread: boolean;
};

export type InboxMessageView = {
  id: number;
  body: string;
  imageUrl: string | null;
  createdAt: string;
  senderRole: InboxSenderRole;
  mine: boolean;
};

export type InboxThreadDetail = {
  id: number;
  subject: string;
  artistId: number | null;
  artistName: string;
  broadcast: boolean;
  repliesDisabled: boolean;
  messages: InboxMessageView[];
};

export type InboxArtistOption = {
  id: number;
  displayName: string;
};

export type InboxThreadList = {
  threads: InboxThreadSummary[];
  artists: InboxArtistOption[];
};
