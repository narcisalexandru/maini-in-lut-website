export type AuditAction =
  | "ARTIST_APPROVED"
  | "ARTIST_REJECTED"
  | "ARTIST_SUSPENDED"
  | "ARTIST_REACTIVATED"
  | "ARTIST_DELETED"
  | "PRODUCT_CREATED"
  | "PRODUCT_UPDATED"
  | "PRODUCT_SUBMITTED"
  | "PRODUCT_APPROVED"
  | "PRODUCT_REJECTED"
  | "PRODUCT_CHANGES_PROPOSED"
  | "PRODUCT_CHANGES_ACCEPTED"
  | "PRODUCT_CHANGES_REJECTED"
  | "ORDER_ITEM_STATUS_UPDATED";

export type AuditTargetType = "ARTIST" | "PRODUCT" | "ORDER" | "ORDER_ITEM";

export interface AuditLogEntry {
  id: number;
  actorUserId: number;
  actorRole: "SUPER_ADMIN" | "ARTIST" | "CLIENT";
  actorName: string;
  actorEmail: string;
  relatedArtistId: number | null;
  relatedArtistName: string | null;
  action: AuditAction;
  targetType: AuditTargetType;
  targetId: number | null;
  targetLabel: string | null;
  metadata: Record<string, unknown> | null;
  createdAt: string;
}

export interface AuditLogFilterOptions {
  superAdmins: Array<{ id: number; name: string; email: string }>;
  artists: Array<{
    id: number;
    userId: number | null;
    displayName: string;
    email: string | null;
  }>;
  actions: AuditAction[];
}

export interface AuditLogFilters {
  actorUserId?: number;
  actorRole?: string;
  relatedArtistId?: number;
  action?: string;
}
