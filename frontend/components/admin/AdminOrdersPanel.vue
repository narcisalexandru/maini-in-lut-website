<template>
  <div class="orders-panel" :class="{ 'orders-panel--fill': contained }">
    <TabView v-model:active-index="activeTab" @tab-change="onTabChange">
      <TabPanel :header="t('activeOrders')">
        <OrdersTable
          class="orders-panel__table"
          :contained="contained"
          :orders="visibleOrders"
          :loading="loading"
          :status-options="statusOptions"
          :payment-status-options="paymentStatusOptions"
          :item-status-label="itemStatusLabel"
          :payment-status-label="paymentStatusLabel"
          :format-date="formatDate"
          :show-customer-links="showCustomerLinks"
          :show-artist-column="showArtistFilter || !fixedArtistId"
          :can-edit-delivery="isSuperAdmin"
          :can-issue-invoice="isSuperAdmin"
          :initial-query="initialQuery"
          @changed="loadOrders({ silent: true })"
        />
      </TabPanel>
      <TabPanel :header="t('archivedOrders')">
        <OrdersTable
          class="orders-panel__table"
          :contained="contained"
          :orders="visibleOrders"
          :loading="loading"
          archived
          :status-options="archivedItemStatusOptions"
          :payment-status-options="paymentStatusOptions"
          :item-status-label="itemStatusLabel"
          :payment-status-label="paymentStatusLabel"
          :format-date="formatDate"
          :show-customer-links="showCustomerLinks"
          :show-artist-column="showArtistFilter || !fixedArtistId"
          :can-edit-delivery="isSuperAdmin"
          :can-issue-invoice="isSuperAdmin"
          :initial-query="initialQuery"
          :unarchiving-order-id="unarchivingOrderId"
          @changed="loadOrders({ silent: true })"
          @unarchive="unarchive"
        />
      </TabPanel>
    </TabView>
  </div>
</template>

<script setup>
import TabView from "primevue/tabview";
import TabPanel from "primevue/tabpanel";
import OrdersTable from "~/components/admin/OrdersTable.vue";
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
  contained: {
    type: Boolean,
    default: false,
  },
});

const { t, locale } = useI18n({ useScope: "local" });
const toast = useToast();
const route = useRoute();
const { userRole, isSuperAdmin } = useAuth();
const { getAllOrders, getAdminOrder, getArtistOrders, unarchiveOrder } = useOrders();

const orders = ref([]);
const loading = ref(true);
const unarchivingOrderId = ref(null);
const activeTab = ref(0);

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
  { label: t("paymentAwaitingCash"), value: "AWAITING_CASH" },
  { label: t("paymentPaid"), value: "PAID" },
  { label: t("paymentFailed"), value: "FAILED" },
]);

const statusOptions = computed(() => itemStatusOptions.value);

const itemStatusLabel = (status) =>
  itemStatusOptions.value.find((option) => option.value === status)?.label ||
  status;

const paymentStatusLabel = (status) =>
  paymentStatusOptions.value.find((option) => option.value === status)?.label ||
  status;

const formatDate = (value) =>
  new Date(value).toLocaleDateString(locale.value === "en" ? "en-GB" : "ro-RO");

const initialQuery = computed(() =>
  typeof route.query.q === "string" ? route.query.q : "",
);

const visibleItems = (order) => {
  if (!props.filterItemsForArtistId) {
    return order.items || [];
  }
  return (order.items || []).filter(
    (item) => item.artistId === props.filterItemsForArtistId,
  );
};

const visibleOrders = computed(() =>
  orders.value
    .map((order) => ({
      ...order,
      items: visibleItems(order),
    }))
    .filter((order) => order.items.length > 0),
);

const buildFilters = () => ({
  artistId: props.fixedArtistId || undefined,
  userId: props.fixedUserId ?? undefined,
  archived: activeTab.value === 1,
});

const loadOrders = async ({ silent = false } = {}) => {
  if (!silent) loading.value = true;
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
    if (!silent) loading.value = false;
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
  loadOrders();
};

onMounted(loadOrders);

defineExpose({ reload: loadOrders });
</script>

<i18n lang="json">
{
  "ro": {
    "activeOrders": "Active",
    "archivedOrders": "Arhivate",
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
    "paymentAwaitingCash": "Așteaptă numerar",
    "paymentPaid": "Plătită",
    "paymentFailed": "Plată eșuată"
  },
  "en": {
    "activeOrders": "Active",
    "archivedOrders": "Archived",
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
    "paymentAwaitingCash": "Awaiting cash",
    "paymentPaid": "Paid",
    "paymentFailed": "Payment failed"
  }
}
</i18n>

<style scoped>
.orders-panel--fill {
  display: flex;
  flex-direction: column;
  flex: 1 1 auto;
  min-height: 0;
  height: 100%;
}

.orders-panel--fill :deep(.p-tabview) {
  display: flex;
  flex-direction: column;
  flex: 1 1 auto;
  min-height: 0;
}

.orders-panel--fill :deep(.p-tabview-panels) {
  display: flex;
  flex-direction: column;
  flex: 1 1 auto;
  min-height: 0;
  padding: 0;
}

.orders-panel--fill :deep(.p-tabview-panel) {
  display: flex;
  flex-direction: column;
  flex: 1 1 auto;
  min-height: 0;
  overflow: hidden;
}

.orders-panel--fill :deep(.orders-panel__table) {
  flex: 1 1 auto;
  min-height: 0;
}
</style>
