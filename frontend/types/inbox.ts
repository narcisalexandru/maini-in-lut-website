export type InboxSenderRole = "ARTIST" | "SUPER_ADMIN" | "CLIENT";

export type InboxThreadSummary = {
  id: number;
  subject: string;
  artistId: number;
  artistName: string;
  lastMessageAt: string;
  preview: string;
  unread: boolean;
};

export type InboxMessageView = {
  id: number;
  body: string;
  createdAt: string;
  senderRole: InboxSenderRole;
  mine: boolean;
};

export type InboxThreadDetail = {
  id: number;
  subject: string;
  artistId: number;
  artistName: string;
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
