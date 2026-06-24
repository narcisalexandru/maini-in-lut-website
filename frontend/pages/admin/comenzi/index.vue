<template>
  <div>
    <h1 class="text-2xl font-bold h-color-lunar-green mb-6">{{ t("title") }}</h1>

    <AdminFiltersBar
      :search="searchFilter"
      :status="itemStatusFilter"
      :payment-status="paymentStatusFilter"
      :artist-id="artistFilter"
      :status-options="itemStatusOptions"
      :payment-status-options="paymentStatusOptions"
      :artist-options="artistOptions"
      :show-artist-filter="isSuperAdmin"
      :show-payment-filter="true"
      :status-label="t('itemStatus')"
      :search-placeholder="t('searchPlaceholder')"
      @update:search="searchFilter = $event"
      @update:status="itemStatusFilter = $event"
      @update:payment-status="paymentStatusFilter = $event"
      @update:artist-id="artistFilter = $event"
      @clear="clearFilters"
    />

    <div v-if="loading" class="flex justify-center py-12">
      <i class="ph ph-spinner text-3xl animate-spin h-color-primary"></i>
    </div>

    <div v-else class="space-y-4">
      <div
        v-for="order in filteredOrders"
        :key="order.id"
        class="h-bg-white rounded-xl shadow p-4 md:p-6"
      >
        <div class="flex flex-col md:flex-row md:items-center md:justify-between gap-2 mb-4">
          <div>
            <div class="font-semibold h-color-lunar-green">
              {{ order.publicOrderNumber }}
            </div>
            <div class="text-sm h-color-lunar-green">
              {{ formatDate(order.createdAt) }} · {{ order.totalRon }} RON
            </div>
            <div
              v-if="order.customer?.email"
              class="text-sm h-color-lunar-green"
            >
              {{ order.customer.firstName }} {{ order.customer.lastName }} ·
              {{ order.customer.email }}
            </div>
          </div>
          <Tag :value="paymentStatusLabel(order.paymentStatus)" severity="info" />
        </div>

        <div
          v-for="item in order.items || []"
          :key="item.id"
          class="flex flex-col md:flex-row md:items-center md:justify-between gap-3 border-t border-gray-100 pt-3 mt-3"
        >
          <div>
            <div class="font-medium">{{ item.title }}</div>
            <div class="text-sm h-color-lunar-green">
              {{ item.artistDisplayName }} · {{ item.quantity }} ×
              {{ item.unitPriceRon }} RON
            </div>
          </div>
          <div class="flex items-center gap-2">
            <Tag :value="itemStatusLabel(item.status)" />
            <Select
              v-if="canUpdateStatus(order)"
              :model-value="item.status"
              :options="statusOptions"
              option-label="label"
              option-value="value"
              class="w-40"
              @update:model-value="(value) => updateStatus(item.id, value)"
            />
          </div>
        </div>
      </div>

      <p v-if="!filteredOrders.length" class="text-center h-color-lunar-green py-8">
        {{ t("empty") }}
      </p>
    </div>
  </div>
</template>

<script setup>
import Tag from "primevue/tag";
import Select from "primevue/select";
import AdminFiltersBar from "~/components/admin/AdminFiltersBar.vue";
import { useToast } from "primevue/usetoast";

definePageMeta({
  layout: "admin",
  middleware: ["auth", "admin"],
});

const { t, locale } = useI18n({ useScope: "local" });
const toast = useToast();
const { loadUser, userRole, isSuperAdmin } = useAuth();
const { listArtists } = useArtist();
const { getAllOrders, getAdminOrder, getArtistOrders, updateOrderItemStatus } = useOrders();

const orders = ref([]);
const artistsForFilter = ref([]);
const loading = ref(true);
const searchFilter = ref("");
const itemStatusFilter = ref(null);
const paymentStatusFilter = ref(null);
const artistFilter = ref(null);

const itemStatusOptions = computed(() => [
  { label: t("statusPending"), value: "PENDING" },
  { label: t("statusProcessing"), value: "PROCESSING" },
  { label: t("statusShipped"), value: "SHIPPED" },
  { label: t("statusDelivered"), value: "DELIVERED" },
  { label: t("statusCancelled"), value: "CANCELLED" },
]);

const paymentStatusOptions = computed(() => [
  { label: t("paymentPending"), value: "PENDING" },
  { label: t("paymentPaid"), value: "PAID" },
  { label: t("paymentFailed"), value: "FAILED" },
]);

const artistOptions = computed(() =>
  artistsForFilter.value.map((artist) => ({
    label: artist.displayName,
    value: artist.id,
  })),
);

const statusOptions = computed(() => itemStatusOptions.value);

const itemStatusLabel = (status) =>
  itemStatusOptions.value.find((option) => option.value === status)?.label ||
  status;

const paymentStatusLabel = (status) =>
  paymentStatusOptions.value.find((option) => option.value === status)?.label ||
  status;

const filteredOrders = computed(() => {
  const query = searchFilter.value.trim().toLowerCase();
  if (!query) return orders.value;

  return orders.value.filter((order) => {
    const haystack = [
      order.publicOrderNumber,
      order.customer?.firstName,
      order.customer?.lastName,
      order.customer?.email,
      order.customer?.phone,
      ...(order.items || []).flatMap((item) => [
        item.title,
        item.artistDisplayName,
      ]),
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();

    return haystack.includes(query);
  });
});

const clearFilters = () => {
  searchFilter.value = "";
  itemStatusFilter.value = null;
  paymentStatusFilter.value = null;
  artistFilter.value = null;
};

const formatDate = (value) =>
  new Date(value).toLocaleDateString(locale.value === "en" ? "en-GB" : "ro-RO");

const canUpdateStatus = (order) => order.paymentStatus === "PAID";

const buildFilters = () => ({
  paymentStatus: paymentStatusFilter.value || undefined,
  itemStatus: itemStatusFilter.value || undefined,
  artistId: isSuperAdmin.value ? artistFilter.value || undefined : undefined,
});

const loadOrders = async () => {
  loading.value = true;
  try {
    const filters = buildFilters();

    if (userRole.value === "SUPER_ADMIN") {
      const summaries = await getAllOrders(filters);
      orders.value = await Promise.all(
        summaries.map((summary) => getAdminOrder(summary.id)),
      );
    } else {
      orders.value = await getArtistOrders(filters);
    }
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

const loadArtistOptions = async () => {
  if (!isSuperAdmin.value) return;
  try {
    artistsForFilter.value = await listArtists("APPROVED");
  } catch {
    artistsForFilter.value = [];
  }
};

watch([itemStatusFilter, paymentStatusFilter, artistFilter], () => {
  loadOrders();
});

const updateStatus = async (itemId, status) => {
  try {
    await updateOrderItemStatus(itemId, status);
    toast.add({ severity: "success", summary: t("updated"), life: 3000 });
    await loadOrders();
  } catch (error) {
    toast.add({
      severity: "error",
      summary: t("error"),
      detail: error.message,
      life: 4000,
    });
  }
};

onMounted(async () => {
  await loadUser();
  await loadArtistOptions();
  await loadOrders();
});
</script>

<i18n lang="json">
{
  "ro": {
    "title": "Comenzi",
    "searchPlaceholder": "Caută după număr comandă, client sau produs...",
    "itemStatus": "Status produs",
    "empty": "Nicio comandă nu corespunde filtrelor.",
    "error": "Eroare",
    "updated": "Status actualizat",
    "statusPending": "În așteptare",
    "statusProcessing": "În procesare",
    "statusShipped": "Expediat",
    "statusDelivered": "Livrat",
    "statusCancelled": "Anulat",
    "paymentPending": "Plată în așteptare",
    "paymentPaid": "Plătită",
    "paymentFailed": "Plată eșuată"
  },
  "en": {
    "title": "Orders",
    "searchPlaceholder": "Search by order number, customer, or product...",
    "itemStatus": "Item status",
    "empty": "No orders match the current filters.",
    "error": "Error",
    "updated": "Status updated",
    "statusPending": "Pending",
    "statusProcessing": "Processing",
    "statusShipped": "Shipped",
    "statusDelivered": "Delivered",
    "statusCancelled": "Cancelled",
    "paymentPending": "Payment pending",
    "paymentPaid": "Paid",
    "paymentFailed": "Payment failed"
  }
}
</i18n>
