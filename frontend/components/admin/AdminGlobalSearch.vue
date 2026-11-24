<template>
  <div class="relative">
    <label class="sr-only" for="admin-global-search">{{ t("label") }}</label>
    <i class="ph ph-magnifying-glass admin-global-search__icon"></i>
    <InputText
      id="admin-global-search"
      v-model="query"
      class="w-full"
      :placeholder="t('placeholder')"
      autocomplete="off"
      @focus="open = true"
      @keydown.down.prevent="move(1)"
      @keydown.up.prevent="move(-1)"
      @keydown.enter.prevent="openActive"
      @keydown.esc="open = false"
    />

    <div
      v-if="open && query.trim().length >= 2"
      class="admin-global-search__panel"
    >
      <div v-if="loading" class="px-4 py-3 text-sm h-color-lunar-green">
        {{ t("searching") }}
      </div>
      <p v-else-if="!flatResults.length" class="px-4 py-3 text-sm h-color-lunar-green m-0">
        {{ t("empty") }}
      </p>
      <div v-else>
        <section v-for="group in groups" :key="group.type" class="py-1">
          <p class="px-4 pt-2 pb-1 text-xs font-semibold uppercase tracking-wide text-gray-500 m-0">
            {{ group.label }}
          </p>
          <button
            v-for="hit in group.hits"
            :key="`${hit.type}-${hit.id}`"
            type="button"
            class="admin-global-search__hit"
            :class="{ 'admin-global-search__hit--active': activeIndex === hit.index }"
            @mouseenter="activeIndex = hit.index"
            @click="go(hit)"
          >
            <span class="font-medium h-color-lunar-green">{{ hit.title }}</span>
            <span class="text-xs text-gray-500">{{ hit.subtitle }}</span>
          </button>
        </section>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import InputText from "primevue/inputtext";
import type { AdminSearchHit, AdminSearchResponse } from "~/types/admin-table";

type ListedHit = AdminSearchHit & { index: number };

const { t } = useI18n({ useScope: "local" });
const localePath = useLocalePath();
const router = useRouter();
const { searchAdmin } = useAdminWorkspace();

const query = ref("");
const open = ref(false);
const loading = ref(false);
const activeIndex = ref(0);
const results = ref<AdminSearchResponse>({
  customers: [],
  orders: [],
  products: [],
  artists: [],
});

let timer: ReturnType<typeof setTimeout> | null = null;
let requestId = 0;

const groups = computed(() => {
  let index = 0;
  const sections: Array<{ type: ListedHit["type"]; label: string; hits: ListedHit[] }> = [];
  const push = (type: ListedHit["type"], label: string, hits: AdminSearchHit[]) => {
    if (!hits.length) return;
    sections.push({
      type,
      label,
      hits: hits.map((hit) => {
        const listed = { ...hit, index };
        index += 1;
        return listed;
      }),
    });
  };
  push("customer", t("customers"), results.value.customers);
  push("order", t("orders"), results.value.orders);
  push("product", t("products"), results.value.products);
  push("artist", t("artists"), results.value.artists);
  return sections;
});

const flatResults = computed(() => groups.value.flatMap((group) => group.hits));

const runSearch = async (value: string) => {
  const current = ++requestId;
  loading.value = true;
  try {
    const response = await searchAdmin(value);
    if (current !== requestId) return;
    results.value = response;
    activeIndex.value = 0;
  } catch {
    if (current !== requestId) return;
    results.value = { customers: [], orders: [], products: [], artists: [] };
  } finally {
    if (current === requestId) loading.value = false;
  }
};

watch(query, (value) => {
  open.value = true;
  if (timer) clearTimeout(timer);
  const term = value.trim();
  if (term.length < 2) {
    results.value = { customers: [], orders: [], products: [], artists: [] };
    loading.value = false;
    return;
  }
  timer = setTimeout(() => {
    runSearch(term);
  }, 250);
});

const move = (step: number) => {
  if (!flatResults.value.length) return;
  open.value = true;
  activeIndex.value =
    (activeIndex.value + step + flatResults.value.length) % flatResults.value.length;
};

const go = async (hit: AdminSearchHit) => {
  const [pathPart, queryPart] = hit.path.split("?");
  const path = localePath(pathPart);
  open.value = false;
  query.value = "";
  await router.push(queryPart ? `${path}?${queryPart}` : path);
};

const openActive = () => {
  const hit = flatResults.value[activeIndex.value];
  if (hit) go(hit);
};

const onPointerDown = (event: MouseEvent) => {
  const target = event.target as Node | null;
  const root = document.getElementById("admin-global-search")?.parentElement;
  if (root && target && !root.contains(target)) {
    open.value = false;
  }
};

onMounted(() => document.addEventListener("pointerdown", onPointerDown));
onBeforeUnmount(() => {
  document.removeEventListener("pointerdown", onPointerDown);
  if (timer) clearTimeout(timer);
});
</script>

<style scoped>
.admin-global-search__icon {
  position: absolute;
  left: 0.85rem;
  top: 50%;
  transform: translateY(-50%);
  color: #6b7280;
  z-index: 1;
}

.admin-global-search__panel {
  position: absolute;
  z-index: 30;
  top: calc(100% + 0.4rem);
  left: 0;
  right: 0;
  max-height: 24rem;
  overflow: auto;
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 0.85rem;
  box-shadow: 0 16px 40px rgba(15, 23, 42, 0.12);
}

.admin-global-search__hit {
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 0.1rem;
  padding: 0.55rem 1rem;
  text-align: left;
  background: transparent;
  border: 0;
  cursor: pointer;
}

.admin-global-search__hit--active,
.admin-global-search__hit:hover {
  background: #f3f6ee;
}

:deep(.p-inputtext) {
  padding-left: 2.4rem;
  width: 100%;
}
</style>

<i18n lang="json">
{
  "ro": {
    "label": "Căutare în admin",
    "placeholder": "Caută în tot adminul: client, comandă, produs, artist...",
    "searching": "Se caută...",
    "empty": "Niciun rezultat.",
    "customers": "Clienți",
    "orders": "Comenzi",
    "products": "Produse",
    "artists": "Artiști"
  },
  "en": {
    "label": "Search admin",
    "placeholder": "Search the whole admin: customer, order, product, artist...",
    "searching": "Searching...",
    "empty": "No results.",
    "customers": "Customers",
    "orders": "Orders",
    "products": "Products",
    "artists": "Artists"
  }
}
</i18n>
