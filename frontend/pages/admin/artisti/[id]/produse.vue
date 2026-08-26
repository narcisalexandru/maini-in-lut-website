<template>
  <div>
    <AdminFiltersBar
      :search="searchFilter"
      :status="statusFilter"
      :status-options="productStatusOptions"
      :show-artist-filter="false"
      :show-status-filter="true"
      :show-search="true"
      :search-placeholder="t('searchPlaceholder')"
      @update:search="searchFilter = $event"
      @update:status="statusFilter = $event"
      @clear="clearFilters"
    />

    <ProductsTable
      :products="filteredProducts"
      :loading="loading"
      mode="list"
      @refresh="loadProducts"
    />
  </div>
</template>

<script setup>
import ProductsTable from "~/components/admin/ProductsTable.vue";
import AdminFiltersBar from "~/components/admin/AdminFiltersBar.vue";
import { useToast } from "primevue/usetoast";
import { useArtistAdminContext } from "~/composables/useArtistAdminContext";

const { t } = useI18n({ useScope: "local" });
const toast = useToast();
const { artistId } = useArtistAdminContext();
const { listMyProducts } = useArtist();

const products = ref([]);
const loading = ref(true);
const searchFilter = ref("");
const statusFilter = ref(null);

const productStatusOptions = computed(() => [
  { label: t("statusDraft"), value: "DRAFT" },
  { label: t("statusPendingReview"), value: "PENDING_REVIEW" },
  { label: t("statusPendingUpdateReview"), value: "PENDING_UPDATE_REVIEW" },
  { label: t("statusPendingConfirmation"), value: "PENDING_ARTIST_CONFIRMATION" },
  { label: t("statusApproved"), value: "APPROVED" },
  { label: t("statusRejected"), value: "REJECTED" },
]);

const filterProductsBySearch = (items) => {
  const query = searchFilter.value.trim().toLowerCase();
  if (!query) return items;

  return items.filter((product) => {
    const haystack = [product.title, product.category, product.status]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();
    return haystack.includes(query);
  });
};

const filteredProducts = computed(() => filterProductsBySearch(products.value));

const clearFilters = () => {
  searchFilter.value = "";
  statusFilter.value = null;
};

const loadProducts = async () => {
  loading.value = true;
  try {
    products.value = await listMyProducts({
      artistId: artistId.value,
      status: statusFilter.value || undefined,
    });
  } catch (error) {
    toast.add({
      severity: "error",
      summary: t("error"),
      detail: error.message,
      life: 4000,
    });
  } finally {
    loading.value = false;
  }
};

watch(statusFilter, loadProducts);

onMounted(loadProducts);
</script>

<i18n lang="json">
{
  "ro": {
    "searchPlaceholder": "Caută după titlu sau categorie...",
    "error": "Eroare",
    "statusDraft": "Ciornă",
    "statusPendingReview": "De validat",
    "statusPendingUpdateReview": "Modificări de validat",
    "statusPendingConfirmation": "Așteaptă confirmare artist",
    "statusApproved": "Aprobat",
    "statusRejected": "Respins"
  },
  "en": {
    "searchPlaceholder": "Search by title or category...",
    "error": "Error",
    "statusDraft": "Draft",
    "statusPendingReview": "Pending review",
    "statusPendingUpdateReview": "Updates pending review",
    "statusPendingConfirmation": "Awaiting artist confirmation",
    "statusApproved": "Approved",
    "statusRejected": "Rejected"
  }
}
</i18n>
