<template>
  <div>
    <AdminDataTable
      table-key="admin-products"
      :rows="tableRows"
      :columns="columns"
      :loading="loading"
      track-changes
      :search-fields="['title', 'status', 'artistName', 'category']"
      :search-placeholder="t('searchPlaceholder')"
      :empty-label="t('empty')"
      :pin-to-top="isAwaitingReview"
      :row-class="reviewRowClass"
      @changed="emit('refresh')"
    >
      <template v-if="mode === 'review'" #cell-changes="{ row }">
        <span
          v-if="row.pendingProposal"
          class="inline-flex items-center rounded-full bg-amber-100 px-2.5 py-1 text-xs font-medium text-amber-800"
        >
          {{ changeCount(row) }} {{ t('changesCountLabel') }}
        </span>
        <span v-else class="text-xs text-gray-500">{{ t('newProduct') }}</span>
      </template>
      <template #actions="{ row }">
          <div class="flex flex-nowrap gap-2">
            <Button
              v-if="mode === 'artist' && ['DRAFT', 'REJECTED'].includes(row.status)"
              size="small"
              :label="t('edit')"
              @click="editProduct(row)"
            />
            <Button
              v-if="mode === 'artist' && row.status === 'APPROVED' && !row.pendingProposal"
              size="small"
              :label="t('editListed')"
              @click="editListedProduct(row)"
            />
            <Button
              v-if="mode === 'artist' && ['DRAFT', 'REJECTED'].includes(row.status)"
              size="small"
              severity="success"
              :label="t('submit')"
              @click="emit('submit', row.id)"
            />
            <Button
              v-if="mode === 'artist' && row.status === 'PENDING_ARTIST_CONFIRMATION'"
              size="small"
              :label="t('acceptChanges')"
              @click="emit('accept-changes', row.id)"
            />
            <Button
              v-if="mode === 'review' || mode === 'list'"
              size="small"
              severity="secondary"
              icon="ph ph-list-bullets"
              :label="t('details')"
              @click="openDetails(row)"
            />
            <Button
              v-if="(mode === 'review' || mode === 'list') && isSuperAdmin"
              size="small"
              :label="t('edit')"
              @click="editProductAsAdmin(row)"
            />
            <Button
              v-if="mode === 'review' || mode === 'list'"
              size="small"
              severity="secondary"
              icon="ph ph-eye"
              :label="t('preview')"
              @click="openPreview(row)"
            />
            <Button
              v-if="mode === 'review'"
              size="small"
              severity="success"
              :label="t('approve')"
              @click="emit('approve', row.id)"
            />
            <Button
              v-if="mode === 'review'"
              size="small"
              severity="danger"
              :label="t('reject')"
              @click="emit('reject', asProduct(row))"
            />
            <Button
              size="small"
              severity="danger"
              icon="ph ph-trash"
              :label="t('delete')"
              @click="openDeleteDialog(row)"
            />
          </div>
          <p
            v-if="mode === 'artist' && row.status === 'PENDING_UPDATE_REVIEW'"
            class="text-xs text-amber-700 mt-2 m-0"
          >
            {{ t("updateReviewPending") }}
          </p>
        </template>
    </AdminDataTable>

    <Dialog
      v-model:visible="deleteDialogVisible"
      modal
      :header="t('deleteTitle')"
      :style="{ width: '480px' }"
    >
      <p class="text-sm h-color-lunar-green m-0">
        {{ t('deleteConfirm', { title: productToDelete?.title ?? '' }) }}
      </p>
      <template #footer>
        <Button
          severity="secondary"
          :label="t('cancel')"
          :disabled="deleting"
          @click="deleteDialogVisible = false"
        />
        <Button
          severity="danger"
          :label="t('deleteConfirmAction')"
          :loading="deleting"
          @click="confirmDelete"
        />
      </template>
    </Dialog>
  </div>
</template>

<script setup lang="ts">
import Button from "primevue/button";
import Dialog from "primevue/dialog";
import { useToast } from "primevue/usetoast";
import type { AdminProduct } from "~/types/product";
import type { AdminTableColumn, AdminTableRow } from "~/types/admin-table";
import AdminDataTable from "~/components/admin/AdminDataTable.vue";
import { countProductChanges } from "~/utils/product-changes";

const props = defineProps<{
  products: AdminProduct[];
  loading: boolean;
  mode: "artist" | "review" | "list";
}>();

const emit = defineEmits<{
  refresh: [];
  submit: [id: number];
  approve: [id: number];
  reject: [product: AdminProduct];
  "accept-changes": [id: number];
}>();

const { t, locale } = useI18n({ useScope: "local" });
const toast = useToast();
const localePath = useLocalePath();
const router = useRouter();
const { isSuperAdmin } = useAuth();
const { deleteProduct } = useArtist();

const deleteDialogVisible = ref(false);
const productToDelete = ref<AdminProduct | null>(null);
const deleting = ref(false);

const statusLabel = (status: string) => {
  const map: Record<string, string> = {
    DRAFT: t("statusDraft"),
    PENDING_REVIEW: t("statusPendingReview"),
    PENDING_UPDATE_REVIEW: t("statusPendingUpdateReview"),
    PENDING_ARTIST_CONFIRMATION: t("statusPendingConfirmation"),
    APPROVED: t("statusApproved"),
    REJECTED: t("statusRejected"),
  };
  return map[status] ?? status;
};

const REVIEW_STATUSES = new Set(["PENDING_REVIEW", "PENDING_UPDATE_REVIEW"]);

const isAwaitingReview = (row: AdminTableRow) => REVIEW_STATUSES.has(String(row.status));

const reviewRowClass = (row: AdminTableRow) =>
  isAwaitingReview(row) ? "admin-data-table__row--review" : "";

const canEditProduct = (row: AdminTableRow) => {
  if (isSuperAdmin.value) return true;
  return ["DRAFT", "REJECTED"].includes(String(row.status));
};

const statusOptions = computed(() =>
  ["DRAFT", "PENDING_REVIEW", "PENDING_UPDATE_REVIEW", "PENDING_ARTIST_CONFIRMATION", "APPROVED", "REJECTED"].map(
    (value) => ({ value, label: statusLabel(value) }),
  ),
);

const tableRows = computed<AdminTableRow[]>(() =>
  props.products.map((product) => ({
    ...product,
    artistName: product.artist?.displayName || "",
    price: Number(product.price),
    stockQuantity: Number(product.stockQuantity ?? 0),
    rowLabel: product.title,
  })),
);

const columns = computed<AdminTableColumn[]>(() => {
  const cols: AdminTableColumn[] = [
    { field: "title", header: t("title"), width: "28%" },
    {
      field: "status",
      header: t("status"),
      filter: "select",
      filterOptions: statusOptions.value,
      format: (value) => statusLabel(String(value)),
      width: "12%",
    },
  ];
  if (props.mode === "review" || props.mode === "list") {
    cols.push({ field: "artistName", header: t("artist"), width: "14%" });
  }
  cols.push(
    { field: "category", header: t("category"), width: "12%" },
    {
      field: "price",
      header: t("price"),
      editable: "number",
      editKind: "product-fields",
      canEdit: canEditProduct,
      format: (value) => `${value} RON`,
      width: "10%",
    },
    {
      field: "stockQuantity",
      header: t("stock"),
      editable: "number",
      editKind: "product-fields",
      canEdit: canEditProduct,
      width: "8%",
    },
  );
  if (props.mode === "review") {
    cols.push({ field: "changes", header: t("changes"), sortable: false, minWidth: "9rem" });
  }
  return cols;
});

const asProduct = (row: AdminTableRow) => row as unknown as AdminProduct;

const changeCount = (product: AdminTableRow) => {
  const item = asProduct(product);
  if (!item.pendingProposal) return 0;
  return countProductChanges(
    item,
    item.pendingProposal.changes,
    locale.value,
  );
};

const editProduct = (product: AdminTableRow) => {
  router.push(localePath(`/admin/produse/${product.id}/editare`));
};

const editListedProduct = (product: AdminTableRow) => {
  router.push(localePath(`/admin/produse/${product.id}/modificare`));
};

const openDetails = (product: AdminTableRow) => {
  router.push(localePath(`/admin/produse/${product.id}/detalii`));
};

const editProductAsAdmin = (product: AdminTableRow) => {
  router.push(localePath(`/admin/produse/${product.id}/editare-admin`));
};

const openPreview = (product: AdminTableRow) => {
  const path = localePath(`/admin/produse/${product.id}/previzualizare`);
  window.open(path, "_blank", "noopener,noreferrer");
};

const openDeleteDialog = (product: AdminTableRow) => {
  productToDelete.value = asProduct(product);
  deleteDialogVisible.value = true;
};

const confirmDelete = async () => {
  if (!productToDelete.value) return;
  deleting.value = true;
  try {
    await deleteProduct(productToDelete.value.id);
    toast.add({
      severity: "success",
      summary: t("deleted"),
      life: 3000,
    });
    deleteDialogVisible.value = false;
    productToDelete.value = null;
    emit("refresh");
  } catch (error) {
    toast.add({
      severity: "error",
      summary: t("error"),
      detail: error instanceof Error ? error.message : t("error"),
      life: 4000,
    });
  } finally {
    deleting.value = false;
  }
};

</script>

<i18n lang="json">
{
  "ro": {
    "title": "Titlu",
    "status": "Status",
    "artist": "Artist",
    "price": "Preț",
    "category": "Categorie",
    "stock": "Stoc",
    "searchPlaceholder": "Caută titlu, categorie sau artist...",
    "empty": "Niciun produs nu corespunde filtrelor.",
    "changes": "Modificări",
    "changesCountLabel": "modificări",
    "actions": "Acțiuni",
    "edit": "Editează",
    "editListed": "Modifică date",
    "submit": "Trimite la review",
    "acceptChanges": "Acceptă modificări",
    "approve": "Aprobă",
    "reject": "Respinge",
    "delete": "Șterge",
    "deleteTitle": "Șterge produsul",
    "deleteConfirm": "Sigur vrei să ștergi „{title}”? Produsul va dispărea din magazin. Comenzile existente păstrează datele produsului.",
    "deleteConfirmAction": "Da, șterge",
    "cancel": "Anulare",
    "deleted": "Produs șters",
    "error": "Eroare",
    "details": "Detalii",
    "preview": "Previzualizare",
    "newProduct": "Produs nou",
    "updateReviewPending": "Modificările sunt în așteptarea validării super-admin.",
    "statusDraft": "Ciornă",
    "statusPendingReview": "De validat",
    "statusPendingUpdateReview": "Modificări de validat",
    "statusPendingConfirmation": "Așteaptă confirmare artist",
    "statusApproved": "Aprobat",
    "statusRejected": "Respins"
  },
  "en": {
    "title": "Title",
    "status": "Status",
    "artist": "Artist",
    "price": "Price",
    "category": "Category",
    "stock": "Stock",
    "searchPlaceholder": "Search title, category, or artist...",
    "empty": "No products match the current filters.",
    "changes": "Changes",
    "changesCountLabel": "changes",
    "actions": "Actions",
    "edit": "Edit",
    "editListed": "Edit details",
    "submit": "Submit for review",
    "acceptChanges": "Accept changes",
    "approve": "Approve",
    "reject": "Reject",
    "delete": "Delete",
    "deleteTitle": "Delete product",
    "deleteConfirm": "Are you sure you want to delete \"{title}\"? It will be removed from the store. Existing orders keep the product snapshot.",
    "deleteConfirmAction": "Yes, delete",
    "cancel": "Cancel",
    "deleted": "Product deleted",
    "error": "Error",
    "details": "Details",
    "preview": "Preview",
    "newProduct": "New product",
    "updateReviewPending": "Changes are awaiting super-admin approval.",
    "statusDraft": "Draft",
    "statusPendingReview": "Pending review",
    "statusPendingUpdateReview": "Updates pending review",
    "statusPendingConfirmation": "Awaiting artist confirmation",
    "statusApproved": "Approved",
    "statusRejected": "Rejected"
  }
}
</i18n>
