<template>
  <div
    ref="root"
    class="admin-data-table"
    :class="{ 'admin-data-table--contained': contained }"
    tabindex="0"
    @keydown="onKeydown"
  >
    <div class="admin-data-table__toolbar">
      <div class="admin-data-table__search">
        <i class="ph ph-magnifying-glass"></i>
        <InputText
          :model-value="search"
          :placeholder="searchPlaceholder || t('searchPlaceholder')"
          @update:model-value="search = String($event ?? '')"
        />
      </div>

      <div v-if="selectColumns.length" class="admin-data-table__filters">
        <Select
          v-for="column in selectColumns"
          :key="column.field"
          :model-value="selectFilters[column.field] || null"
          :options="column.filterOptions || []"
          option-label="label"
          option-value="value"
          show-clear
          :placeholder="column.header"
          class="min-w-[11rem]"
          @update:model-value="selectFilters[column.field] = $event || ''"
        />
      </div>

      <div class="admin-data-table__meta">
        <span>{{ t("count", { count: visibleRows.length }) }}</span>
        <template v-if="trackChanges">
          <Button
            size="small"
            severity="secondary"
            outlined
            icon="ph ph-arrow-counter-clockwise"
            :label="t('undo')"
            :disabled="!history.canUndo || busy"
            @click="runUndo"
          />
          <Button
            size="small"
            severity="secondary"
            outlined
            icon="ph ph-arrow-clockwise"
            :label="t('redo')"
            :disabled="!history.canRedo || busy"
            @click="runRedo"
          />
          <Button
            size="small"
            severity="secondary"
            icon="ph ph-clock-counter-clockwise"
            :label="t('history')"
            @click="historyOpen = true"
          />
        </template>
      </div>
    </div>

    <div v-if="loading" class="flex justify-center py-12">
      <i class="ph ph-spinner text-3xl animate-spin h-color-primary"></i>
    </div>

    <DataTable
      v-else
      :value="visibleRows"
      data-key="id"
      striped-rows
      size="small"
      :scrollable="contained"
      :scroll-height="contained ? 'flex' : undefined"
      paginator
      :rows="25"
      :rows-per-page-options="[10, 25, 50, 100]"
      :row-class="rowClass"
      class="text-sm admin-data-table__grid"
    >
      <Column
        v-for="column in columns"
        :key="column.field"
        :field="column.field"
        :style="columnStyle(column)"
      >
        <template #header>
          <button
            v-if="column.sortable !== false"
            type="button"
            class="admin-data-table__sort"
            :class="column.align === 'right' ? 'admin-data-table__sort--right' : ''"
            @click="toggleSort(column)"
          >
            <span>{{ column.header }}</span>
            <i
              class="ph"
              :class="
                sortField === column.field
                  ? sortOrder === 1
                    ? 'ph-caret-up'
                    : 'ph-caret-down'
                  : 'ph-caret-up-down'
              "
            />
          </button>
          <span v-else>{{ column.header }}</span>
        </template>
        <template #body="{ data }">
          <div
            class="admin-data-table__cell"
            :class="[
              column.align === 'right' ? 'admin-data-table__cell--right' : '',
              column.cellClass ? column.cellClass(data) : '',
            ]"
          >
            <input
              v-if="editingKey === cellKey(data, column) && column.editable !== 'select'"
              v-model="draft"
              class="admin-data-table__input"
              type="text"
              :inputmode="column.editable === 'number' ? 'decimal' : 'text'"
              @keydown.enter.prevent="requestConfirm(data, column)"
              @keydown.esc.prevent="cancelEdit"
            />
            <select
              v-else-if="editingKey === cellKey(data, column)"
              v-model="draft"
              class="admin-data-table__input"
              @change="onSelectChange($event, data, column)"
              @keydown.esc.prevent="cancelEdit"
            >
              <option
                v-for="option in column.editOptions || []"
                :key="option.value"
                :value="option.value"
              >
                {{ option.label }}
              </option>
            </select>
            <button
              v-else-if="isEditable(column, data)"
              type="button"
              class="admin-data-table__value"
              @click="beginEdit(data, column)"
            >
              {{ formatCell(column, data) }}
            </button>
            <slot
              v-else-if="slots[`cell-${column.field}`]"
              :name="`cell-${column.field}`"
              :row="data"
              :value="data[column.field]"
            />
            <span v-else class="truncate">{{ formatCell(column, data) }}</span>
          </div>
        </template>
      </Column>
      <Column
        v-if="slots.actions"
        :header="actionsHeader || t('actions')"
        :style="{ whiteSpace: 'nowrap' }"
      >
        <template #body="{ data }">
          <slot name="actions" :row="data" />
        </template>
      </Column>
      <template #empty>
        <p class="text-center h-color-lunar-green py-8 m-0">{{ emptyLabel || t("empty") }}</p>
      </template>
    </DataTable>

    <Dialog
      v-model:visible="confirmOpen"
      modal
      :header="t('confirmTitle')"
      :style="{ width: '480px' }"
    >
      <p class="text-sm h-color-lunar-green m-0 mb-3">
        {{ t("confirmBody", { row: pending?.rowLabel || "" }) }}
      </p>
      <p class="text-sm m-0">
        <span class="font-medium">{{ pending?.fieldLabel }}</span>
        <span class="mx-2 text-gray-400">{{ pending?.previousLabel }}</span>
        <i class="ph ph-arrow-right text-gray-400"></i>
        <span class="ml-2 font-semibold h-color-lunar-green">{{ pending?.nextLabel }}</span>
      </p>
      <template #footer>
        <Button severity="secondary" :label="t('cancel')" :disabled="busy" @click="confirmOpen = false" />
        <Button :label="t('save')" :loading="busy" @click="confirmEdit" />
      </template>
    </Dialog>

    <Dialog
      v-model:visible="historyOpen"
      modal
      :header="t('historyTitle')"
      :style="{ width: '640px' }"
    >
      <p class="text-sm h-color-lunar-green mt-0">{{ t("historyHint", { limit: history.limit }) }}</p>
      <p v-if="!history.revisions.length" class="text-sm m-0">{{ t("historyEmpty") }}</p>
      <ul v-else class="list-none p-0 m-0 flex flex-col gap-2">
        <li v-if="history.cursor !== history.baseline">
          <button type="button" class="admin-data-table__version" :disabled="busy" @click="runRestore(history.baseline)">
            <span>{{ t("baseline") }}</span>
            <span class="text-xs text-gray-500">{{ t("restore") }}</span>
          </button>
        </li>
        <li v-for="revision in history.revisions" :key="revision.sequence">
          <button
            type="button"
            class="admin-data-table__version"
            :class="{ 'admin-data-table__version--current': revision.sequence === history.cursor }"
            :disabled="busy || revision.sequence === history.cursor"
            @click="runRestore(revision.sequence)"
          >
            <span>
              <span class="block font-medium">{{ revision.summary }}</span>
              <span class="block text-xs text-gray-500">
                {{ formatHistoryValue(revision.previousValue) }} → {{ formatHistoryValue(revision.nextValue) }}
                · {{ formatWhen(revision.createdAt) }}
              </span>
            </span>
            <span class="text-xs text-gray-500">
              {{ revision.sequence === history.cursor ? t("current") : t("restore") }}
            </span>
          </button>
        </li>
      </ul>
    </Dialog>
  </div>
</template>

<script setup lang="ts">
import DataTable from "primevue/datatable";
import Column from "primevue/column";
import InputText from "primevue/inputtext";
import Select from "primevue/select";
import Button from "primevue/button";
import Dialog from "primevue/dialog";
import { useToast } from "primevue/usetoast";
import type { AdminTableColumn, AdminTableHistory, AdminTableRow } from "~/types/admin-table";

const props = withDefaults(
  defineProps<{
    tableKey: string;
    rows: AdminTableRow[];
    columns: AdminTableColumn[];
    loading?: boolean;
    trackChanges?: boolean;
    searchFields?: string[];
    searchPlaceholder?: string;
    emptyLabel?: string;
    initialQuery?: string;
    actionsHeader?: string;
    contained?: boolean;
    pinToTop?: (row: AdminTableRow) => boolean;
    rowClass?: (row: AdminTableRow) => string;
  }>(),
  {
    loading: false,
    trackChanges: false,
    searchFields: () => [],
    searchPlaceholder: "",
    emptyLabel: "",
    initialQuery: "",
    actionsHeader: "",
    contained: false,
    pinToTop: undefined,
    rowClass: undefined,
  },
);

const emit = defineEmits<{ changed: [] }>();

const root = ref<HTMLElement | null>(null);
const slots = useSlots();
const { t, locale } = useI18n({ useScope: "local" });
const toast = useToast();
const { getTableHistory, applyTableEdit, undoTableEdit, redoTableEdit, restoreTableRevision } =
  useAdminWorkspace();

const search = ref("");
const selectFilters = reactive<Record<string, string>>({});
const sortField = ref<string | null>(null);
const sortOrder = ref<1 | -1>(1);
const editingKey = ref("");
const draft = ref("");
const confirmOpen = ref(false);
const historyOpen = ref(false);
const busy = ref(false);
const pending = ref<{
  row: AdminTableRow;
  column: AdminTableColumn;
  previous: string;
  next: string;
  previousLabel: string;
  nextLabel: string;
  rowLabel: string;
  fieldLabel: string;
} | null>(null);

const history = ref<AdminTableHistory>({
  cursor: 0,
  baseline: 0,
  limit: 50,
  canUndo: false,
  canRedo: false,
  revisions: [],
});

const selectColumns = computed(() =>
  props.columns.filter((column) => column.filter === "select" && column.filterOptions?.length),
);

const toggleSort = (column: AdminTableColumn) => {
  if (sortField.value === column.field) {
    sortOrder.value = sortOrder.value === 1 ? -1 : 1;
    return;
  }
  sortField.value = column.field;
  sortOrder.value = 1;
};

const compareValues = (left: unknown, right: unknown) => {
  if (typeof left === "number" && typeof right === "number") return left - right;
  return String(left ?? "").localeCompare(String(right ?? ""), "ro", { numeric: true });
};

const visibleRows = computed(() => {
  const term = search.value.trim().toLowerCase();
  const fields = props.searchFields.length
    ? props.searchFields
    : props.columns.map((column) => column.field);

  const filtered = props.rows.filter((row) => {
    if (term) {
      const haystack = fields
        .map((field) => row[field])
        .filter((value) => value !== null && value !== undefined)
        .join(" ")
        .toLowerCase();
      if (!haystack.includes(term)) return false;
    }

    return selectColumns.value.every((column) => {
      const selected = selectFilters[column.field];
      if (!selected) return true;
      return normalizeFilterValue(row[column.field]) === selected;
    });
  });

  return filtered
    .map((row, index) => ({ row, index }))
    .sort((left, right) => {
      const pinLeft = props.pinToTop?.(left.row) ? 0 : 1;
      const pinRight = props.pinToTop?.(right.row) ? 0 : 1;
      if (pinLeft !== pinRight) return pinLeft - pinRight;
      if (sortField.value) {
        const result = compareValues(left.row[sortField.value], right.row[sortField.value]);
        if (result !== 0) return result * sortOrder.value;
      }
      return left.index - right.index;
    })
    .map((item) => item.row);
});

watch(
  () => props.initialQuery,
  (value) => {
    search.value = value || "";
  },
  { immediate: true },
);

const loadHistory = async () => {
  if (!props.trackChanges) return;
  try {
    history.value = await getTableHistory(props.tableKey);
  } catch {
    history.value = { ...history.value, canUndo: false, canRedo: false, revisions: [] };
  }
};

onMounted(loadHistory);
watch(() => props.rows, () => {
  loadHistory();
});

const columnStyle = (column: AdminTableColumn) => ({
  width: column.width,
  minWidth: column.minWidth || "8rem",
  textAlign: column.align || "left",
});

const cellKey = (row: AdminTableRow, column: AdminTableColumn) => `${row.id}:${column.field}`;

const normalizeFilterValue = (value: unknown) => {
  if (typeof value === "boolean") return value ? "true" : "false";
  return String(value ?? "");
};

const toEditString = (value: unknown) => {
  if (value === null || value === undefined) return "";
  if (typeof value === "boolean") return value ? "true" : "false";
  return String(value);
};

const formatCell = (column: AdminTableColumn, row: AdminTableRow) => {
  const value = row[column.field];
  if (column.format) return column.format(value, row);
  if (value === null || value === undefined || value === "") return "—";
  return String(value);
};

const labelFor = (column: AdminTableColumn, raw: string, row: AdminTableRow) => {
  const option = column.editOptions?.find((item) => item.value === raw);
  if (option) return option.label;
  if (column.format) {
    const parsed =
      column.editable === "number"
        ? Number(raw)
        : raw === "true"
          ? true
          : raw === "false"
            ? false
            : raw;
    return column.format(parsed, row);
  }
  return raw || "—";
};

const isEditable = (column: AdminTableColumn, row: AdminTableRow) => {
  if (!column.editable || !column.editKind) return false;
  return column.canEdit ? column.canEdit(row) : true;
};

const beginEdit = (row: AdminTableRow, column: AdminTableColumn) => {
  editingKey.value = cellKey(row, column);
  draft.value = toEditString(row[column.field]);
  nextTick(() => {
    const input = root.value?.querySelector<HTMLInputElement>("input.admin-data-table__input");
    if (!input) return;
    input.focus();
    const end = input.value.length;
    input.setSelectionRange(end, end);
  });
};

const cancelEdit = () => {
  editingKey.value = "";
  draft.value = "";
};

const onSelectChange = (event: Event, row: AdminTableRow, column: AdminTableColumn) => {
  draft.value = (event.target as HTMLSelectElement).value;
  requestConfirm(row, column);
};

const requestConfirm = (row: AdminTableRow, column: AdminTableColumn) => {
  const previous = toEditString(row[column.field]);
  const next = draft.value.trim();
  if (previous === next) {
    cancelEdit();
    return;
  }
  pending.value = {
    row,
    column,
    previous,
    next,
    previousLabel: labelFor(column, previous, row),
    nextLabel: labelFor(column, next, row),
    rowLabel: String(row.rowLabel || row.title || row.name || row.id),
    fieldLabel: column.header,
  };
  if (column.skipConfirm) {
    void confirmEdit();
    return;
  }
  confirmOpen.value = true;
};

const showError = (error: unknown) => {
  toast.add({
    severity: "error",
    summary: t("error"),
    detail: error instanceof Error ? error.message : t("error"),
    life: 4000,
  });
};

const confirmEdit = async () => {
  if (!pending.value?.column.editKind) return;
  busy.value = true;
  try {
    history.value = await applyTableEdit(props.tableKey, {
      kind: pending.value.column.editKind,
      targetId: Number(pending.value.row[pending.value.column.editIdField || "id"]),
      field: pending.value.column.field,
      fieldLabel: pending.value.fieldLabel,
      rowLabel: pending.value.rowLabel,
      previousValue: pending.value.previous,
      nextValue: pending.value.next,
    });
    confirmOpen.value = false;
    cancelEdit();
    toast.add({ severity: "success", summary: t("saved"), life: 2500 });
    emit("changed");
  } catch (error) {
    showError(error);
  } finally {
    busy.value = false;
  }
};

const runHistoryAction = async (action: () => Promise<AdminTableHistory>) => {
  busy.value = true;
  try {
    history.value = await action();
    toast.add({ severity: "success", summary: t("restored"), life: 2500 });
    emit("changed");
  } catch (error) {
    showError(error);
  } finally {
    busy.value = false;
  }
};

const runUndo = () => runHistoryAction(() => undoTableEdit(props.tableKey));
const runRedo = () => runHistoryAction(() => redoTableEdit(props.tableKey));
const runRestore = (sequence: number) =>
  runHistoryAction(() => restoreTableRevision(props.tableKey, sequence));

const onKeydown = (event: KeyboardEvent) => {
  if (!props.trackChanges || !(event.ctrlKey || event.metaKey)) return;
  if (event.key.toLowerCase() !== "z") return;
  const target = event.target as HTMLElement | null;
  if (target && (target.tagName === "INPUT" || target.tagName === "TEXTAREA")) return;
  event.preventDefault();
  if (event.shiftKey) {
    if (history.value.canRedo) runRedo();
    return;
  }
  if (history.value.canUndo) runUndo();
};

const formatHistoryValue = (value: string | number | boolean | null) => {
  if (value === null || value === undefined || value === "") return "—";
  if (value === true) return t("yes");
  if (value === false) return t("no");
  return String(value);
};

const formatWhen = (value: string) =>
  new Date(value).toLocaleString(locale.value === "en" ? "en-GB" : "ro-RO");
</script>

<style scoped>
.admin-data-table :deep(.p-datatable-table) {
  width: 100%;
}

.admin-data-table :deep(th),
.admin-data-table :deep(td) {
  vertical-align: middle;
}

.admin-data-table :deep(tr.admin-data-table__row--review > td) {
  background: #fff6dc !important;
}

.admin-data-table__sort {
  display: flex;
  align-items: center;
  justify-content: flex-start;
  gap: 0.3rem;
  width: 100%;
  border: 0;
  background: transparent;
  padding: 0;
  font: inherit;
  font-weight: 600;
  color: inherit;
  cursor: pointer;
  text-align: left;
}

.admin-data-table__sort--right {
  justify-content: flex-end;
  text-align: right;
}

.admin-data-table {
  background: white;
  border-radius: 0.85rem;
  box-shadow: 0 1px 2px rgba(15, 23, 42, 0.06);
  outline: none;
}

.admin-data-table--contained {
  display: flex;
  flex-direction: column;
  flex: 1 1 auto;
  min-height: 0;
  overflow: hidden;
}

.admin-data-table--contained :deep(.p-datatable-flex-scrollable) {
  flex: 1 1 auto;
  height: auto;
  min-height: 0;
}

.admin-data-table--contained :deep(.p-datatable-table-container) {
  flex: 1 1 auto;
  height: auto;
  min-height: 0;
}

.admin-data-table__toolbar {
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
  align-items: center;
  padding: 0.9rem 1rem;
  border-bottom: 1px solid #f3f4f6;
}

.admin-data-table__search {
  position: relative;
  flex: 1 1 16rem;
  min-width: 14rem;
}

.admin-data-table__search i {
  position: absolute;
  left: 0.75rem;
  top: 50%;
  transform: translateY(-50%);
  color: #6b7280;
  z-index: 1;
}

.admin-data-table__search :deep(.p-inputtext) {
  width: 100%;
  padding-left: 2.2rem;
}

.admin-data-table__filters,
.admin-data-table__meta {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  align-items: center;
}

.admin-data-table__meta {
  margin-left: auto;
  font-size: 0.8rem;
  color: #4b5563;
}

.admin-data-table__cell {
  display: flex;
  align-items: center;
  width: 100%;
  min-width: 0;
}

.admin-data-table__cell--easybox,
.admin-data-table__cell--address {
  border-radius: 0.5rem;
  padding: 0.15rem 0.4rem;
  border: 2px solid transparent;
}

.admin-data-table__cell--easybox {
  border-color: #dc2626;
  background: #fef2f2;
}

.admin-data-table__cell--address {
  border-color: #16a34a;
  background: #f0fdf4;
}

.admin-data-table__cell--right {
  justify-content: flex-end;
}

.admin-data-table__value,
.admin-data-table__input {
  display: block;
  width: 100%;
  box-sizing: border-box;
  height: 1.75rem;
  margin: 0;
  padding: 0 0.45rem;
  border: 1px solid transparent;
  border-radius: 0.35rem;
  background: transparent;
  box-shadow: none;
  font: inherit;
  line-height: 1.75rem;
  color: inherit;
  text-align: inherit;
}

.admin-data-table__cell--right .admin-data-table__value,
.admin-data-table__cell--right .admin-data-table__input {
  text-align: right;
}

.admin-data-table__value {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  cursor: pointer;
}

.admin-data-table__value:hover {
  background: #eef2e6;
}

.admin-data-table__input {
  color: #243024;
  background: #fff;
  border-color: #c5cbb8;
  outline: none;
}

.admin-data-table__version {
  width: 100%;
  display: flex;
  justify-content: space-between;
  gap: 1rem;
  align-items: center;
  text-align: left;
  border: 1px solid #e5e7eb;
  background: white;
  border-radius: 0.7rem;
  padding: 0.7rem 0.85rem;
  cursor: pointer;
}

.admin-data-table__version--current {
  border-color: #5c6b4a;
  background: #f7f8f3;
}

.admin-data-table__version:disabled {
  cursor: default;
}
</style>

<i18n lang="json">
{
  "ro": {
    "searchPlaceholder": "Caută în tabel...",
    "count": "{count} rânduri",
    "versions": "{count}/{limit} versiuni",
    "undo": "Anulează",
    "redo": "Refă",
    "history": "Versiuni",
    "actions": "Acțiuni",
    "empty": "Niciun rând nu corespunde filtrelor.",
    "confirmTitle": "Confirmi modificarea?",
    "confirmBody": "Modificarea pentru {row} se salvează doar după confirmare.",
    "cancel": "Renunță",
    "save": "Salvează",
    "saved": "Modificare salvată",
    "restored": "Tabel readus la versiunea aleasă",
    "error": "Eroare",
    "historyTitle": "Versiunile tabelului",
    "historyHint": "Fiecare modificare confirmată salvează o versiune. Se păstrează ultimele {limit}; cea mai veche se șterge automat.",
    "historyEmpty": "Încă nu există modificări salvate.",
    "baseline": "Înainte de versiunile păstrate",
    "restore": "Revino aici",
    "current": "Versiunea curentă",
    "yes": "Da",
    "no": "Nu"
  },
  "en": {
    "searchPlaceholder": "Search this table...",
    "count": "{count} rows",
    "versions": "{count}/{limit} versions",
    "undo": "Undo",
    "redo": "Redo",
    "history": "Versions",
    "actions": "Actions",
    "empty": "No rows match the current filters.",
    "confirmTitle": "Confirm this change?",
    "confirmBody": "The change for {row} is saved only after confirmation.",
    "cancel": "Cancel",
    "save": "Save",
    "saved": "Change saved",
    "restored": "Table restored to the selected version",
    "error": "Error",
    "historyTitle": "Table versions",
    "historyHint": "Each confirmed change saves a version. The latest {limit} are kept; the oldest is deleted automatically.",
    "historyEmpty": "No saved changes yet.",
    "baseline": "Before the kept versions",
    "restore": "Restore",
    "current": "Current version",
    "yes": "Yes",
    "no": "No"
  }
}
</i18n>
