<template>
  <AdminDataTable
    table-key="admin-orders"
    :contained="contained"
    :rows="rows"
    :columns="columns"
    :loading="loading"
    :track-changes="!archived"
    :search-fields="searchFields"
    :search-placeholder="t('searchPlaceholder')"
    :empty-label="archived ? t('emptyArchived') : t('emptyActive')"
    :initial-query="initialQuery"
    @changed="emit('changed')"
  >
    <template #cell-createdAt="{ row }">
      {{ formatDate(row.createdAt) }}
    </template>
    <template #cell-orderNumber="{ row }">
      <span class="font-semibold">{{ row.orderNumber }}</span>
    </template>
    <template #cell-customerName="{ row }">
      <NuxtLink
        v-if="showCustomerLinks && row.customerUserId"
        :to="localePath(`/admin/clienti/${row.customerUserId}`)"
        class="text-blue-600 hover:underline"
      >
        {{ row.customerName }}
      </NuxtLink>
      <span v-else>{{ row.customerName || "—" }}</span>
    </template>
    <template #cell-deliveryMethod="{ row }">
      {{ row.deliveryMethod === "EASYBOX" ? t("easybox") : t("address") }}
    </template>
    <template #cell-paymentStatus="{ row }">
      <Tag :value="paymentStatusLabel(row.paymentStatus)" severity="info" />
    </template>
    <template v-if="archived" #actions="{ row }">
      <Button
        v-if="archived"
        :label="t('unarchive')"
        severity="secondary"
        size="small"
        outlined
        :loading="unarchivingOrderId === row.orderId"
        @click="emit('unarchive', row.orderId)"
      />
    </template>
  </AdminDataTable>
</template>

<script setup lang="ts">
import Tag from "primevue/tag";
import Button from "primevue/button";
import AdminDataTable from "~/components/admin/AdminDataTable.vue";
import type { AdminTableColumn, AdminTableRow } from "~/types/admin-table";

type OrderLine = {
  id: number;
  orderId: number;
  orderNumber: string;
  createdAt: string;
  customerName: string;
  customerEmail: string;
  customerUserId: number | null;
  deliveryMethod: "EASYBOX" | "ADDRESS";
  deliveryAddress: string;
  title: string;
  artistName: string;
  quantity: number;
  lineTotal: number;
  paymentStatus: string;
  status: string;
  rowLabel: string;
};

const props = defineProps({
  orders: { type: Array, default: () => [] },
  loading: { type: Boolean, default: false },
  archived: { type: Boolean, default: false },
  showCustomerLinks: { type: Boolean, default: false },
  showArtistColumn: { type: Boolean, default: false },
  initialQuery: { type: String, default: "" },
  unarchivingOrderId: { type: Number, default: null },
  contained: { type: Boolean, default: false },
  canEditDelivery: { type: Boolean, default: false },
  statusOptions: { type: Array, default: () => [] },
  paymentStatusOptions: { type: Array, default: () => [] },
  itemStatusLabel: { type: Function, required: true },
  paymentStatusLabel: { type: Function, required: true },
  formatDate: { type: Function, required: true },
});

const emit = defineEmits(["changed", "unarchive"]);
const { t } = useI18n({ useScope: "local" });
const localePath = useLocalePath();

type IncomingItem = {
  id: number;
  title: string;
  artistDisplayName?: string;
  quantity: number;
  lineTotalRon: number | string;
  status: string;
};

type IncomingOrder = {
  id: number;
  publicOrderNumber: string;
  createdAt: string;
  userId?: number | null;
  paymentStatus: string;
  customer?: { firstName?: string; lastName?: string; email?: string };
  delivery?: { street?: string; city?: string; county?: string; postalCode?: string };
  items?: IncomingItem[];
};

const deliveryAddressOf = (delivery?: IncomingOrder["delivery"]) => {
  const street = delivery?.street?.trim() || "";
  const existing = new Set(
    street
      .split(",")
      .map((part) => part.trim().toLowerCase())
      .filter((part) => part.length > 0),
  );
  const tail = [delivery?.city, delivery?.county, delivery?.postalCode]
    .map((part) => part?.trim() || "")
    .filter((part) => part.length > 0 && !existing.has(part.toLowerCase()));
  return [street, ...tail].filter((part) => part.length > 0).join(", ");
};

const deliveryTone = (row: AdminTableRow) =>
  row.deliveryMethod === "EASYBOX"
    ? "admin-data-table__cell--easybox"
    : "admin-data-table__cell--address";

const rows = computed<AdminTableRow[]>(() =>
  (props.orders as IncomingOrder[]).flatMap((order) =>
    (order.items || []).map((item) => {
      const customerName = `${order.customer?.firstName || ""} ${order.customer?.lastName || ""}`.trim();
      const street = order.delivery?.street?.trim() || "";
      const line: OrderLine = {
        id: item.id,
        orderId: order.id,
        orderNumber: order.publicOrderNumber,
        createdAt: order.createdAt,
        customerName,
        customerEmail: order.customer?.email || "",
        customerUserId: order.userId ?? null,
        deliveryMethod: /^easybox\b/i.test(street) ? "EASYBOX" : "ADDRESS",
        deliveryAddress: deliveryAddressOf(order.delivery),
        title: item.title,
        artistName: item.artistDisplayName || "",
        quantity: item.quantity,
        lineTotal: Number(item.lineTotalRon),
        paymentStatus: order.paymentStatus,
        status: item.status,
        rowLabel: `${order.publicOrderNumber} · ${item.title}`,
      };
      return line;
    }),
  ),
);

const searchFields = ["orderNumber", "customerName", "customerEmail", "deliveryAddress", "title", "artistName", "status", "paymentStatus"];

const columns = computed<AdminTableColumn[]>(() => {
  const statusOptions = props.statusOptions as Array<{ label: string; value: string }>;
  const paymentOptions = props.paymentStatusOptions as Array<{ label: string; value: string }>;
  const cols: AdminTableColumn[] = [
    { field: "orderNumber", header: t("order"), minWidth: "8rem" },
    { field: "createdAt", header: t("date"), minWidth: "8rem" },
    { field: "customerName", header: t("customer"), minWidth: "11rem" },
    { field: "customerEmail", header: t("email"), minWidth: "12rem" },
    {
      field: "deliveryMethod",
      header: t("deliveryMethod"),
      filter: "select",
      filterOptions: [
        { label: t("easybox"), value: "EASYBOX" },
        { label: t("address"), value: "ADDRESS" },
      ],
      cellClass: deliveryTone,
      minWidth: "8rem",
    },
    {
      field: "deliveryAddress",
      header: t("deliveryAddress"),
      editable: props.archived || !props.canEditDelivery ? undefined : "text",
      editKind: props.archived || !props.canEditDelivery ? undefined : "order-delivery",
      editIdField: "orderId",
      cellClass: deliveryTone,
      minWidth: "16rem",
    },
    { field: "title", header: t("product"), minWidth: "12rem" },
  ];
  if (props.showArtistColumn) {
    cols.push({ field: "artistName", header: t("artist"), minWidth: "10rem" });
  }
  cols.push(
    { field: "quantity", header: t("quantity"), align: "right", minWidth: "6rem" },
    {
      field: "lineTotal",
      header: t("total"),
      align: "right",
      minWidth: "7rem",
      format: (value) => `${value} RON`,
    },
    {
      field: "paymentStatus",
      header: t("payment"),
      filter: "select",
      filterOptions: paymentOptions,
      minWidth: "9rem",
    },
    {
      field: "status",
      header: t("status"),
      filter: "select",
      filterOptions: statusOptions,
      editable: props.archived ? undefined : "select",
      editKind: props.archived ? undefined : "order-item-status",
      editOptions: statusOptions,
      skipConfirm: true,
      format: (value) => props.itemStatusLabel(value),
      minWidth: "11rem",
    },
  );
  return cols;
});
</script>

<i18n lang="json">
{
  "ro": {
    "searchPlaceholder": "Caută număr, client, email sau produs...",
    "emptyActive": "Nicio comandă activă nu corespunde filtrelor.",
    "emptyArchived": "Nicio comandă arhivată nu corespunde filtrelor.",
    "order": "Comandă",
    "date": "Data",
    "customer": "Client",
    "email": "Email",
    "deliveryMethod": "Livrare",
    "easybox": "Easybox",
    "address": "Adresă",
    "deliveryAddress": "Adresă livrare",
    "product": "Produs",
    "artist": "Artist",
    "quantity": "Cant.",
    "total": "Total linie",
    "payment": "Plată",
    "status": "Status",
    "unarchive": "Scoate din arhivă"
  },
  "en": {
    "searchPlaceholder": "Search order number, customer, email, or product...",
    "emptyActive": "No active orders match the current filters.",
    "emptyArchived": "No archived orders match the current filters.",
    "order": "Order",
    "date": "Date",
    "customer": "Customer",
    "email": "Email",
    "deliveryMethod": "Delivery",
    "easybox": "Easybox",
    "address": "Address",
    "deliveryAddress": "Delivery address",
    "product": "Product",
    "artist": "Artist",
    "quantity": "Qty",
    "total": "Line total",
    "payment": "Payment",
    "status": "Status",
    "unarchive": "Remove from archive"
  }
}
</i18n>
