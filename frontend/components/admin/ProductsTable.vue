<template>
  <div>
    <div v-if="loading" class="flex justify-center py-12">
      <i class="ph ph-spinner text-3xl animate-spin h-color-primary"></i>
    </div>

    <DataTable v-else :value="products" striped-rows class="text-sm">
      <Column field="title" :header="t('title')" />
      <Column field="status" :header="t('status')">
        <template #body="{ data }">
          <span>{{ statusLabel(data.status) }}</span>
        </template>
      </Column>
      <Column v-if="mode === 'review' || mode === 'list'" field="artist.displayName" :header="t('artist')" />
      <Column :header="t('price')">
        <template #body="{ data }">{{ data.price }} RON</template>
      </Column>
      <Column v-if="mode === 'review'" :header="t('changes')">
        <template #body="{ data }">
          <span
            v-if="data.pendingProposal"
            class="inline-flex items-center rounded-full bg-amber-100 px-2.5 py-1 text-xs font-medium text-amber-800"
          >
            {{ changeCount(data) }} {{ t('changesCountLabel') }}
          </span>
          <span v-else class="text-xs text-gray-500">{{ t('newProduct') }}</span>
        </template>
      </Column>
      <Column :header="t('actions')">
        <template #body="{ data }">
          <div class="flex flex-wrap gap-2">
            <Button
              v-if="mode === 'artist' && ['DRAFT', 'REJECTED'].includes(data.status)"
              size="small"
              :label="t('edit')"
              @click="editProduct(data)"
            />
            <Button
              v-if="mode === 'artist' && data.status === 'APPROVED' && !data.pendingProposal"
              size="small"
              :label="t('editListed')"
              @click="editListedProduct(data)"
            />
            <Button
              v-if="mode === 'artist' && ['DRAFT', 'REJECTED'].includes(data.status)"
              size="small"
              severity="success"
              :label="t('submit')"
              @click="emit('submit', data.id)"
            />
            <Button
              v-if="mode === 'artist' && data.status === 'PENDING_ARTIST_CONFIRMATION'"
              size="small"
              :label="t('acceptChanges')"
              @click="emit('accept-changes', data.id)"
            />
            <Button
              v-if="mode === 'review' || mode === 'list'"
              size="small"
              severity="secondary"
              icon="ph ph-list-bullets"
              :label="t('details')"
              @click="openDetails(data)"
            />
            <Button
              v-if="(mode === 'review' || mode === 'list') && isSuperAdmin"
              size="small"
              :label="t('edit')"
              @click="editProductAsAdmin(data)"
            />
            <Button
              v-if="mode === 'review' || mode === 'list'"
              size="small"
              severity="secondary"
              icon="ph ph-eye"
              :label="t('preview')"
              @click="openPreview(data)"
            />
            <Button
              v-if="mode === 'review'"
              size="small"
              severity="success"
              :label="t('approve')"
              @click="emit('approve', data.id)"
            />
            <Button
              v-if="mode === 'review'"
              size="small"
              severity="danger"
              :label="t('reject')"
              @click="emit('reject', data)"
            />
            <Button
              size="small"
              severity="danger"
              icon="ph ph-trash"
              :label="t('delete')"
              @click="openDeleteDialog(data)"
            />
          </div>
          <p
            v-if="mode === 'artist' && data.status === 'PENDING_UPDATE_REVIEW'"
            class="text-xs text-amber-700 mt-2 m-0"
          >
            {{ t("updateReviewPending") }}
          </p>
        </template>
      </Column>
    </DataTable>

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
import DataTable from "primevue/datatable";
import Column from "primevue/column";
import Button from "primevue/button";
import Dialog from "primevue/dialog";
import { useToast } from "primevue/usetoast";
import type { AdminProduct } from "~/types/product";
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

const changeCount = (product: AdminProduct) => {
  if (!product.pendingProposal) return 0;
  return countProductChanges(
    product,
    product.pendingProposal.changes,
    locale.value,
  );
};

const editProduct = (product: AdminProduct) => {
  router.push(localePath(`/admin/produse/${product.id}/editare`));
};

const editListedProduct = (product: AdminProduct) => {
  router.push(localePath(`/admin/produse/${product.id}/modificare`));
};

const openDetails = (product: AdminProduct) => {
  router.push(localePath(`/admin/produse/${product.id}/detalii`));
};

const editProductAsAdmin = (product: AdminProduct) => {
  router.push(localePath(`/admin/produse/${product.id}/editare-admin`));
};

const openPreview = (product: AdminProduct) => {
  const path = localePath(`/admin/produse/${product.id}/previzualizare`);
  window.open(path, "_blank", "noopener,noreferrer");
};

const openDeleteDialog = (product: AdminProduct) => {
  productToDelete.value = product;
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

watch(
  () => props.products,
  () => {},
);
</script>

<i18n lang="json">
{
  "ro": {
    "title": "Titlu",
    "status": "Status",
    "artist": "Artist",
    "price": "Preț",
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
