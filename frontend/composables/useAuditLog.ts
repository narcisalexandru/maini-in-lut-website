import type {
  AuditLogEntry,
  AuditLogFilterOptions,
  AuditLogFilters,
} from "~/types/audit-log";

function buildQuery(filters?: AuditLogFilters) {
  const params = new URLSearchParams();
  if (filters?.actorUserId) {
    params.set("actorUserId", String(filters.actorUserId));
  }
  if (filters?.actorRole) {
    params.set("actorRole", filters.actorRole);
  }
  if (filters?.relatedArtistId) {
    params.set("relatedArtistId", String(filters.relatedArtistId));
  }
  if (filters?.action) {
    params.set("action", filters.action);
  }
  const query = params.toString();
  return query ? `?${query}` : "";
}

export function useAuditLog() {
  const { apiFetch } = useApi();

  const getFilterOptions = () =>
    apiFetch<AuditLogFilterOptions>("/admin/audit-logs/filter-options");

  const listAuditLogs = (filters?: AuditLogFilters) =>
    apiFetch<AuditLogEntry[]>(`/admin/audit-logs${buildQuery(filters)}`);

  return {
    getFilterOptions,
    listAuditLogs,
  };
}
