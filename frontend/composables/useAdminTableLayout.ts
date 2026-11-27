import { computed, reactive, toValue, watch, type MaybeRef } from "vue";

export type AdminTableLayoutState = {
  order: string[];
  widths: Record<string, number>;
};

const layouts = reactive<Record<string, AdminTableLayoutState>>({});
const emptyLayout: AdminTableLayoutState = { order: [], widths: {} };

const readStored = (key: string): AdminTableLayoutState => {
  if (!import.meta.client) return { order: [], widths: {} };
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return { order: [], widths: {} };
    const parsed = JSON.parse(raw) as { order?: unknown; widths?: unknown };
    const order = Array.isArray(parsed.order)
      ? parsed.order.filter((field): field is string => typeof field === "string")
      : [];
    const widths: Record<string, number> = {};
    if (parsed.widths && typeof parsed.widths === "object") {
      for (const [field, width] of Object.entries(parsed.widths)) {
        if (typeof width === "number" && width >= 72 && width <= 720) widths[field] = width;
      }
    }
    return { order, widths };
  } catch {
    return { order: [], widths: {} };
  }
};

export function useAdminTableLayout(tableKey: MaybeRef<string>) {
  const { user } = useAuthState();
  const storageKey = computed(() =>
    user.value.id > 0 ? `admin-table-layout:${user.value.id}:${toValue(tableKey)}` : "",
  );

  watch(
    storageKey,
    (key) => {
      if (key && !layouts[key]) layouts[key] = readStored(key);
    },
    { immediate: true },
  );

  const layout = computed(() => (storageKey.value && layouts[storageKey.value]) || emptyLayout);

  const persist = () => {
    const key = storageKey.value;
    const current = key ? layouts[key] : null;
    if (!key || !current || !import.meta.client) return;
    localStorage.setItem(
      key,
      JSON.stringify({ order: current.order, widths: current.widths }),
    );
  };

  const update = (mutate: (state: AdminTableLayoutState) => void, save = true) => {
    const key = storageKey.value;
    if (!key) return;
    if (!layouts[key]) layouts[key] = readStored(key);
    mutate(layouts[key]);
    if (save) persist();
  };

  return { layout, update, persist };
}
