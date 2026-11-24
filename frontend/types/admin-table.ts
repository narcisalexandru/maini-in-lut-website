export type AdminTableEditKind =
  | "order-item-status"
  | "order-delivery"
  | "product-fields"
  | "customer-fields";

export type AdminTableOption = {
  label: string;
  value: string;
};

export type AdminTableRow = Record<string, unknown> & {
  id: number | string;
};

export type AdminTableColumn = {
  field: string;
  header: string;
  sortable?: boolean;
  filter?: "text" | "select";
  filterOptions?: AdminTableOption[];
  editable?: "text" | "number" | "select";
  editKind?: AdminTableEditKind;
  editOptions?: AdminTableOption[];
  canEdit?: (row: AdminTableRow) => boolean;
  editIdField?: string;
  skipConfirm?: boolean;
  cellClass?: (row: AdminTableRow) => string;
  format?: (value: unknown, row: AdminTableRow) => string;
  align?: "left" | "right";
  width?: string;
  minWidth?: string;
};

export type AdminTableRevision = {
  sequence: number;
  summary: string;
  field: string;
  fieldLabel: string;
  rowLabel: string;
  previousValue: string | number | boolean | null;
  nextValue: string | number | boolean | null;
  createdAt: string;
};

export type AdminTableHistory = {
  cursor: number;
  baseline: number;
  limit: number;
  canUndo: boolean;
  canRedo: boolean;
  revisions: AdminTableRevision[];
};

export type AdminSearchHit = {
  type: "customer" | "order" | "product" | "artist";
  id: number;
  title: string;
  subtitle: string;
  path: string;
};

export type AdminSearchResponse = {
  customers: AdminSearchHit[];
  orders: AdminSearchHit[];
  products: AdminSearchHit[];
  artists: AdminSearchHit[];
};
