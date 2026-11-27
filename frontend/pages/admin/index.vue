<template>
  <div>
    <h1 class="text-2xl font-bold h-color-lunar-green mb-2">{{ t("title") }}</h1>
    <div class="flex flex-wrap items-center gap-3 mb-8">
      <p class="h-color-lunar-green">{{ t("subtitle") }}</p>
      <UserRoleBadge variant="admin" />
    </div>

    <section class="mb-10" aria-live="polite">
      <div class="flex flex-wrap items-end justify-between gap-4 mb-4">
        <div>
          <h2 class="text-lg font-semibold h-color-lunar-green">
            {{ t("salesTitle") }}
          </h2>
        </div>
      </div>
      <p v-if="loading && !stats" class="h-color-lunar-green">{{ t("loading") }}</p>
      <p v-else-if="loadError && !stats" class="h-color-lunar-green">
        {{ t("loadError") }}
      </p>
      <AdminSalesDashboard
        v-if="stats"
        :stats="stats"
        :user-id="user.id"
        :class="{ 'opacity-60': loading }"
      />
    </section>
  </div>
</template>

<script setup lang="ts">
import type { SalesDashboard } from "~/types/dashboard";

definePageMeta({
  layout: "admin",
  middleware: ["auth", "admin"],
});

const { t } = useI18n({ useScope: "local" });
const { user, loadUser } = useAuth();
const { getArtistSales } = useDashboard();

const stats = ref<SalesDashboard | null>(null);
const loading = ref(true);
const loadError = ref(false);
async function loadSales() {
  loading.value = true;
  loadError.value = false;
  try {
    stats.value = await getArtistSales();
  } catch {
    if (!stats.value) {
      loadError.value = true;
    }
  } finally {
    loading.value = false;
  }
}

onMounted(() => {
  loadUser();
  loadSales();
});
</script>

<i18n lang="json">
{
  "ro": {
    "title": "Dashboard",
    "subtitle": "Gestionează platforma din panoul de administrare.",
    "salesTitle": "Vânzările tale",
    "loading": "Se încarcă statisticile...",
    "loadError": "Nu am putut încărca statisticile de vânzări."
  },
  "en": {
    "title": "Dashboard",
    "subtitle": "Manage the platform from the admin panel.",
    "salesTitle": "Your sales",
    "loading": "Loading statistics...",
    "loadError": "Sales statistics could not be loaded."
  }
}
</i18n>
