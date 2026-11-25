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
    <template #cell-customerNote="{ row }">
      <span class="block truncate" :title="String(row.customerNote || '')">
        {{ row.customerNote || "—" }}
      </span>
    </template>
    <template #cell-paymentStatus="{ row }">
      <Tag :value="paymentStatusLabel(row.paymentStatus)" severity="info" />
    </template>
    <template #cell-invoice="{ row }">
      <a
        v-if="row.invoiceStatus === 'ISSUED' && row.invoiceViewUrl"
        :href="row.invoiceViewUrl"
        target="_blank"
        rel="noopener noreferrer"
        class="text-blue-600 hover:underline"
        :title="row.invoiceIsDraft ? t('invoiceDraftHint') : t('efacturaHint')"
      >
        {{ row.invoiceIsDraft ? t('invoiceDraft') : `${row.invoiceSeries} ${row.invoiceNumber}` }}
      </a>
      <span v-else-if="row.invoiceStatus === 'ISSUED'" :title="t('efacturaHint')">
        {{ row.invoiceIsDraft ? t('invoiceDraft') : `${row.invoiceSeries} ${row.invoiceNumber}` }}
      </span>
      <span v-else-if="row.invoiceStatus === 'ISSUING'">{{ t("invoiceIssuing") }}</span>
      <Button
        v-else-if="canIssueInvoice && row.paymentStatus === 'PAID'"
        :label="row.invoiceStatus === 'FAILED' ? t('invoiceRetry') : t('invoiceIssue')"
        severity="secondary"
        size="small"
        outlined
        :title="row.invoiceError || t('efacturaHint')"
        :loading="issuingOrderId === row.orderId"
        @click="issue(row.orderId)"
      />
      <span v-else>—</span>
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
import { useToast } from "primevue/usetoast";
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
  invoiceStatus: string;
  invoiceSeries: string;
  invoiceNumber: string;
  invoiceViewUrl: string;
  invoiceIsDraft: boolean;
  invoiceError: string;
  status: string;
  customerNote: string;
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
  canIssueInvoice: { type: Boolean, default: false },
  statusOptions: { type: Array, default: () => [] },
  paymentStatusOptions: { type: Array, default: () => [] },
  itemStatusLabel: { type: Function, required: true },
  paymentStatusLabel: { type: Function, required: true },
  formatDate: { type: Function, required: true },
});

const emit = defineEmits(["changed", "unarchive"]);
const { t } = useI18n({ useScope: "local" });
const localePath = useLocalePath();
const toast = useToast();
const { issueInvoice } = useOrders();
const issuingOrderId = ref<number | null>(null);

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
  invoice?: {
    status?: string;
    series?: string | null;
    number?: string | null;
    viewUrl?: string | null;
    isDraft?: boolean;
    errorMessage?: string | null;
  } | null;
  customerNote?: string | null;
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
        invoiceStatus: order.invoice?.status || "",
        invoiceSeries: order.invoice?.series || "",
        invoiceNumber: order.invoice?.number || "",
        invoiceViewUrl: order.invoice?.viewUrl || "",
        invoiceIsDraft: order.invoice?.isDraft === true,
        invoiceError: order.invoice?.errorMessage || "",
        status: item.status,
        customerNote: order.customerNote?.trim() || "",
        rowLabel: `${order.publicOrderNumber} · ${item.title}`,
      };
      return line;
    }),
  ),
);

const searchFields = ["orderNumber", "customerName", "customerEmail", "deliveryAddress", "customerNote", "title", "artistName", "status", "paymentStatus"];

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
    { field: "customerNote", header: t("customerNote"), minWidth: "14rem" },
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
  );
  if (props.canIssueInvoice) {
    cols.push({
      field: "invoice",
      header: t("invoice"),
      minWidth: "10rem",
    });
  }
  cols.push(
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

const issue = async (orderId: number) => {
  issuingOrderId.value = orderId;
  try {
    const invoice = await issueInvoice(orderId);
    toast.add({
      severity: "success",
      summary: invoice.isDraft ? t("invoiceDraftSaved") : t("invoiceIssued"),
      life: 3000,
    });
    emit("changed");
  } catch (error) {
    const detail = error instanceof Error ? error.message : t("invoiceFailed");
    toast.add({ severity: "error", summary: t("invoiceFailed"), detail, life: 5000 });
    emit("changed");
  } finally {
    issuingOrderId.value = null;
  }
};
</script>

<i18n lang="json">
{
  "ro": {
    "searchPlaceholder": "Caută număr, client, email, mențiuni sau produs...",
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
    "customerNote": "Mențiuni",
    "product": "Produs",
    "artist": "Artist",
    "quantity": "Cant.",
    "total": "Total linie",
    "payment": "Plată",
    "invoice": "Factură",
    "invoiceIssue": "Emite factură",
    "invoiceRetry": "Reîncearcă",
    "invoiceIssuing": "Se emite",
    "invoiceIssued": "Factura a fost emisă",
    "invoiceDraft": "Ciornă",
    "invoiceDraftSaved": "Ciorna a fost salvată în SmartBill",
    "invoiceDraftHint": "Ciornă SmartBill. Nu are număr fiscal și nu pleacă în e-Factura.",
    "invoiceFailed": "Factura nu a putut fi emisă",
    "efacturaHint": "e-Factura pleacă din SmartBill, din trimiterea automată în SPV.",
    "status": "Status",
    "unarchive": "Scoate din arhivă"
  },
  "en": {
    "searchPlaceholder": "Search order number, customer, email, notes, or product...",
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
    "customerNote": "Notes",
    "product": "Product",
    "artist": "Artist",
    "quantity": "Qty",
    "total": "Line total",
    "payment": "Payment",
    "invoice": "Invoice",
    "invoiceIssue": "Issue invoice",
    "invoiceRetry": "Retry",
    "invoiceIssuing": "Issuing",
    "invoiceIssued": "Invoice issued",
    "invoiceDraft": "Draft",
    "invoiceDraftSaved": "The draft was saved in SmartBill",
    "invoiceDraftHint": "SmartBill draft. It has no fiscal number and is not sent to e-Factura.",
    "invoiceFailed": "The invoice could not be issued",
    "efacturaHint": "e-Factura is sent by SmartBill when automatic SPV delivery is enabled.",
    "status": "Status",
    "unarchive": "Remove from archive"
  }
}
</i18n>
