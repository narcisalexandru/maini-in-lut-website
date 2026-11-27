import type {
  AdminSearchResponse,
  AdminTableEditKind,
  AdminTableHistory,
} from "~/types/admin-table";

export type AdminTableEditPayload = {
  kind: AdminTableEditKind;
  targetId: number;
  field: string;
  fieldLabel: string;
  rowLabel: string;
  previousValue: string;
  nextValue: string;
};

export function useAdminWorkspace() {
  const { apiFetch } = useApi();

  const searchAdmin = (query: string) =>
    apiFetch<AdminSearchResponse>(
      `/admin/search?q=${encodeURIComponent(query)}`,
    );

  const getTableHistory = (tableKey: string) =>
    apiFetch<AdminTableHistory>(`/admin/tables/${tableKey}/revisions`);

  const applyTableEdit = (tableKey: string, payload: AdminTableEditPayload) =>
    apiFetch<AdminTableHistory>(`/admin/tables/${tableKey}/edits`, {
      method: "POST",
      body: JSON.stringify(payload),
    });

  const undoTableEdit = (tableKey: string) =>
    apiFetch<AdminTableHistory>(`/admin/tables/${tableKey}/undo`, {
      method: "POST",
    });

  const redoTableEdit = (tableKey: string) =>
    apiFetch<AdminTableHistory>(`/admin/tables/${tableKey}/redo`, {
      method: "POST",
    });

  const restoreTableRevision = (tableKey: string, sequence: number) =>
    apiFetch<AdminTableHistory>(`/admin/tables/${tableKey}/restore`, {
      method: "POST",
      body: JSON.stringify({ sequence }),
    });

  return {
    searchAdmin,
    getTableHistory,
    applyTableEdit,
    undoTableEdit,
    redoTableEdit,
    restoreTableRevision,
  };
}
