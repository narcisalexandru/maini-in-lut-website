<template>
  <div>
    <TabView v-model:active-index="activeTab" @tab-change="onTabChange">
      <TabPanel :header="t('activeOrders')">
        <AdminFiltersBar
          :search="searchFilter"
          :status="itemStatusFilter"
          :payment-status="paymentStatusFilter"
          :artist-id="artistFilter"
          :status-options="itemStatusOptions"
          :payment-status-options="paymentStatusOptions"
          :artist-options="artistOptions"
          :show-artist-filter="showArtistFilter"
          :show-payment-filter="true"
          :status-label="t('itemStatus')"
          :search-placeholder="t('searchPlaceholder')"
          @update:search="searchFilter = $event"
          @update:status="itemStatusFilter = $event"
          @update:payment-status="paymentStatusFilter = $event"
          @update:artist-id="artistFilter = $event"
          @clear="clearFilters"
        />
        <OrdersListBody
          :orders="filteredOrders"
          :loading="loading"
          :status-options="statusOptions"
          :item-status-label="itemStatusLabel"
          :payment-status-label="paymentStatusLabel"
          :format-date="formatDate"
          :can-update-status="canUpdateStatus"
          :show-customer-links="showCustomerLinks"
          @update-status="updateStatus"
        />
      </TabPanel>
      <TabPanel :header="t('archivedOrders')">
        <AdminFiltersBar
          :search="searchFilter"
          :status="itemStatusFilter"
          :payment-status="paymentStatusFilter"
          :artist-id="artistFilter"
          :status-options="archivedItemStatusOptions"
          :payment-status-options="paymentStatusOptions"
          :artist-options="artistOptions"
          :show-artist-filter="showArtistFilter"
          :show-payment-filter="true"
          :status-label="t('itemStatus')"
          :search-placeholder="t('searchPlaceholder')"
          @update:search="searchFilter = $event"
          @update:status="itemStatusFilter = $event"
          @update:payment-status="paymentStatusFilter = $event"
          @update:artist-id="artistFilter = $event"
          @clear="clearFilters"
        />
        <OrdersListBody
          :orders="filteredOrders"
          :loading="loading"
          :status-options="statusOptions"
          :item-status-label="itemStatusLabel"
          :payment-status-label="paymentStatusLabel"
          :format-date="formatDate"
          :can-update-status="canUpdateStatus"
          :show-customer-links="showCustomerLinks"
          :unarchiving-order-id="unarchivingOrderId"
          :archived="true"
          @update-status="updateStatus"
          @unarchive="unarchive"
        />
      </TabPanel>
    </TabView>
  </div>
</template>

<script setup>
import TabView from "primevue/tabview";
import TabPanel from "primevue/tabpanel";
import AdminFiltersBar from "~/components/admin/AdminFiltersBar.vue";
import OrdersListBody from "~/components/admin/OrdersListBody.vue";
import { useToast } from "primevue/usetoast";

const props = defineProps({
  fixedArtistId: {
    type: Number,
    default: null,
  },
  fixedUserId: {
    type: Number,
    default: null,
  },
  showArtistFilter: {
    type: Boolean,
    default: false,
  },
  showCustomerLinks: {
    type: Boolean,
    default: false,
  },
  filterItemsForArtistId: {
    type: Number,
    default: null,
  },
});

const { t, locale } = useI18n({ useScope: "local" });
const toast = useToast();
const localePath = useLocalePath();
const { userRole, isSuperAdmin } = useAuth();
const { listArtists } = useArtist();
const { getAllOrders, getAdminOrder, getArtistOrders, updateOrderItemStatus, unarchiveOrder } = useOrders();

const orders = ref([]);
const artistsForFilter = ref([]);
const loading = ref(true);
const unarchivingOrderId = ref(null);
const activeTab = ref(0);
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

const archivedItemStatusOptions = computed(() =>
  itemStatusOptions.value.filter((option) =>
    ["DELIVERED", "CANCELLED"].includes(option.value),
  ),
);

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

const formatDate = (value) =>
  new Date(value).toLocaleDateString(locale.value === "en" ? "en-GB" : "ro-RO");

const canUpdateStatus = (order) =>
  activeTab.value === 0 && order.paymentStatus === "PAID";

const visibleItems = (order) => {
  if (!props.filterItemsForArtistId) {
    return order.items || [];
  }
  return (order.items || []).filter(
    (item) => item.artistId === props.filterItemsForArtistId,
  );
};

const filteredOrders = computed(() => {
  const query = searchFilter.value.trim().toLowerCase();
  const withVisibleItems = orders.value
    .map((order) => ({
      ...order,
      items: visibleItems(order),
    }))
    .filter((order) => order.items.length > 0);

  if (!query) return withVisibleItems;

  return withVisibleItems.filter((order) => {
    const haystack = [
      order.publicOrderNumber,
      order.customer?.firstName,
      order.customer?.lastName,
      order.customer?.email,
      order.customer?.phone,
      ...order.items.flatMap((item) => [item.title, item.artistDisplayName]),
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
  if (!props.fixedArtistId) {
    artistFilter.value = null;
  }
};

const buildFilters = () => ({
  paymentStatus: paymentStatusFilter.value || undefined,
  itemStatus: itemStatusFilter.value || undefined,
  artistId: props.fixedArtistId ?? (isSuperAdmin.value ? artistFilter.value || undefined : undefined),
  userId: props.fixedUserId ?? undefined,
  archived: activeTab.value === 1,
});

const loadOrders = async () => {
  loading.value = true;
  try {
    const filters = buildFilters();

    if (userRole.value === "ARTIST") {
      orders.value = await getArtistOrders(filters);
    } else {
      const summaries = await getAllOrders(filters);
      orders.value = await Promise.all(
        summaries.map((summary) => getAdminOrder(summary.id)),
      );
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
  if (!props.showArtistFilter) return;
  try {
    artistsForFilter.value = await listArtists("APPROVED");
  } catch {
    artistsForFilter.value = [];
  }
};

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

const unarchive = async (orderId) => {
  unarchivingOrderId.value = orderId;
  try {
    await unarchiveOrder(orderId);
    toast.add({ severity: "success", summary: t("unarchived"), life: 3000 });
    activeTab.value = 0;
    await loadOrders();
  } catch (error) {
    toast.add({
      severity: "error",
      summary: t("error"),
      detail: error.message,
      life: 4000,
    });
  } finally {
    unarchivingOrderId.value = null;
  }
};

const onTabChange = () => {
  itemStatusFilter.value = null;
  loadOrders();
};

watch([itemStatusFilter, paymentStatusFilter, artistFilter], () => {
  loadOrders();
});

onMounted(async () => {
  if (props.fixedArtistId) {
    artistFilter.value = props.fixedArtistId;
  }
  await loadArtistOptions();
  await loadOrders();
});

defineExpose({ reload: loadOrders });
</script>

<i18n lang="json">
{
  "ro": {
    "activeOrders": "Active",
    "archivedOrders": "Arhivate",
    "searchPlaceholder": "Caută după număr comandă, client sau produs...",
    "itemStatus": "Status produs",
    "error": "Eroare",
    "updated": "Status actualizat",
    "unarchived": "Comanda a fost scoasă din arhivă",
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
    "activeOrders": "Active",
    "archivedOrders": "Archived",
    "searchPlaceholder": "Search by order number, customer, or product...",
    "itemStatus": "Item status",
    "error": "Error",
    "updated": "Status updated",
    "unarchived": "Order removed from archive",
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
