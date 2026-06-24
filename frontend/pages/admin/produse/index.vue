<template>
  <div>
    <div class="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
      <h1 class="text-2xl font-bold h-color-lunar-green">{{ t("title") }}</h1>
      <NuxtLink v-if="isArtist" :to="localePath('/admin/produse/nou')">
        <Button :label="t('addProduct')" icon="ph ph-plus" />
      </NuxtLink>
    </div>

    <AdminFiltersBar
      :search="searchFilter"
      :status="statusFilter"
      :artist-id="artistFilter"
      :status-options="productStatusOptions"
      :artist-options="artistOptions"
      :show-artist-filter="isSuperAdmin"
      :show-status-filter="!isSuperAdmin || activeTab !== 0"
      :show-search="true"
      :search-placeholder="t('searchPlaceholder')"
      @update:search="searchFilter = $event"
      @update:status="statusFilter = $event"
      @update:artist-id="artistFilter = $event"
      @clear="clearFilters"
    />

    <TabView v-if="isSuperAdmin" v-model:active-index="activeTab">
      <TabPanel :header="t('reviewQueue')">
        <ProductsTable
          :products="filteredReviewQueue"
          :loading="loadingReview"
          mode="review"
          @refresh="loadData"
          @approve="handleApprove"
          @reject="openRejectProduct"
        />
      </TabPanel>
      <TabPanel :header="t('allProducts')">
        <ProductsTable
          :products="filteredAllProducts"
          :loading="loadingProducts"
          mode="list"
          @refresh="loadData"
        />
      </TabPanel>
    </TabView>

    <ProductsTable
      v-else
      :products="filteredMyProducts"
      :loading="loadingProducts"
      mode="artist"
      @refresh="loadData"
      @submit="handleSubmit"
      @accept-changes="handleAcceptChanges"
    />
  </div>
</template>

<script setup>
import TabView from "primevue/tabview";
import TabPanel from "primevue/tabpanel";
import Button from "primevue/button";
import ProductsTable from "~/components/admin/ProductsTable.vue";
import AdminFiltersBar from "~/components/admin/AdminFiltersBar.vue";
import { useToast } from "primevue/usetoast";

definePageMeta({
  layout: "admin",
  middleware: ["auth", "admin"],
});

const { t } = useI18n({ useScope: "local" });
const toast = useToast();
const localePath = useLocalePath();
const { isSuperAdmin, isArtist } = useAuth();
const {
  listArtists,
  listMyProducts,
  listReviewQueue,
  submitProduct,
  approveProduct,
  rejectProduct,
  acceptProductChanges,
} = useArtist();

const myProducts = ref([]);
const reviewQueue = ref([]);
const allProducts = ref([]);
const artistsForFilter = ref([]);
const loadingProducts = ref(true);
const loadingReview = ref(true);
const activeTab = ref(0);
const searchFilter = ref("");
const statusFilter = ref(null);
const artistFilter = ref(null);

const productStatusOptions = computed(() => [
  { label: t("statusDraft"), value: "DRAFT" },
  { label: t("statusPendingReview"), value: "PENDING_REVIEW" },
  { label: t("statusPendingConfirmation"), value: "PENDING_ARTIST_CONFIRMATION" },
  { label: t("statusApproved"), value: "APPROVED" },
  { label: t("statusRejected"), value: "REJECTED" },
]);

const artistOptions = computed(() =>
  artistsForFilter.value.map((artist) => ({
    label: artist.displayName,
    value: artist.id,
  })),
);

const filterProductsBySearch = (products) => {
  const query = searchFilter.value.trim().toLowerCase();
  if (!query) return products;

  return products.filter((product) => {
    const haystack = [
      product.title,
      product.category,
      product.artist?.displayName,
      product.status,
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();

    return haystack.includes(query);
  });
};

const filterReviewQueue = (products) => {
  let result = products;

  if (artistFilter.value) {
    result = result.filter((product) => product.artistId === artistFilter.value);
  }

  return filterProductsBySearch(result);
};

const filteredMyProducts = computed(() => filterProductsBySearch(myProducts.value));
const filteredAllProducts = computed(() => filterProductsBySearch(allProducts.value));
const filteredReviewQueue = computed(() => filterReviewQueue(reviewQueue.value));

const clearFilters = () => {
  searchFilter.value = "";
  statusFilter.value = null;
  artistFilter.value = null;
};

const loadProducts = async () => {
  loadingProducts.value = true;
  try {
    const params = {
      status: statusFilter.value || undefined,
      artistId: isSuperAdmin.value ? artistFilter.value || undefined : undefined,
    };
    myProducts.value = await listMyProducts(params);
    allProducts.value = myProducts.value;
  } catch (error) {
    toast.add({ severity: "error", summary: t("error"), detail: error.message, life: 4000 });
  } finally {
    loadingProducts.value = false;
  }
};

const loadData = async () => {
  await loadProducts();

  if (isSuperAdmin.value) {
    loadingReview.value = true;
    try {
      reviewQueue.value = await listReviewQueue();
    } catch (error) {
      toast.add({ severity: "error", summary: t("error"), detail: error.message, life: 4000 });
    } finally {
      loadingReview.value = false;
    }
  }
};

const loadArtistOptions = async () => {
  if (!isSuperAdmin.value) return;
  try {
    artistsForFilter.value = await listArtists("APPROVED");
  } catch {
    artistsForFilter.value = [];
  }
};

watch([statusFilter, artistFilter], () => {
  if (activeTab.value === 1 || !isSuperAdmin.value) {
    loadProducts();
  }
});

const handleSubmit = async (id) => {
  try {
    await submitProduct(id);
    toast.add({ severity: "success", summary: t("submitted"), life: 3000 });
    await loadData();
  } catch (error) {
    toast.add({ severity: "error", summary: t("error"), detail: error.message, life: 4000 });
  }
};

const handleApprove = async (id) => {
  try {
    await approveProduct(id);
    toast.add({ severity: "success", summary: t("approved"), life: 3000 });
    await loadData();
  } catch (error) {
    toast.add({ severity: "error", summary: t("error"), detail: error.message, life: 4000 });
  }
};

const openRejectProduct = async (product) => {
  const reason = prompt(t("rejectReasonPrompt"));
  if (!reason?.trim()) return;
  try {
    await rejectProduct(product.id, reason.trim());
    toast.add({ severity: "success", summary: t("rejected"), life: 3000 });
    await loadData();
  } catch (error) {
    toast.add({ severity: "error", summary: t("error"), detail: error.message, life: 4000 });
  }
};

const handleAcceptChanges = async (id) => {
  try {
    await acceptProductChanges(id);
    toast.add({ severity: "success", summary: t("changesAccepted"), life: 3000 });
    await loadData();
  } catch (error) {
    toast.add({ severity: "error", summary: t("error"), detail: error.message, life: 4000 });
  }
};

onMounted(async () => {
  await loadArtistOptions();
  await loadData();
});
</script>

<i18n lang="json">
{
  "ro": {
    "title": "Produse",
    "searchPlaceholder": "Caută după titlu, categorie sau artist...",
    "addProduct": "Adaugă produs",
    "reviewQueue": "De validat",
    "allProducts": "Toate produsele",
    "submitted": "Trimis la validare",
    "approved": "Produs aprobat",
    "rejected": "Produs respins",
    "changesAccepted": "Modificări acceptate",
    "rejectReasonPrompt": "Motiv respingere:",
    "error": "Eroare",
    "statusDraft": "Ciornă",
    "statusPendingReview": "De validat",
    "statusPendingConfirmation": "Așteaptă confirmare artist",
    "statusApproved": "Aprobat",
    "statusRejected": "Respins"
  },
  "en": {
    "title": "Products",
    "searchPlaceholder": "Search by title, category, or artist...",
    "addProduct": "Add product",
    "reviewQueue": "Review queue",
    "allProducts": "All products",
    "submitted": "Submitted for review",
    "approved": "Product approved",
    "rejected": "Product rejected",
    "changesAccepted": "Changes accepted",
    "rejectReasonPrompt": "Rejection reason:",
    "error": "Error",
    "statusDraft": "Draft",
    "statusPendingReview": "Pending review",
    "statusPendingConfirmation": "Awaiting artist confirmation",
    "statusApproved": "Approved",
    "statusRejected": "Rejected"
  }
}
</i18n>
