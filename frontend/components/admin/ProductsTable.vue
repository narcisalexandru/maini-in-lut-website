<template>
  <div>
    <div v-if="loading" class="flex justify-center py-12">
      <i class="ph ph-spinner text-3xl animate-spin h-color-primary"></i>
    </div>

    <DataTable v-else :value="products" striped-rows class="text-sm">
      <Column field="title" :header="t('title')" />
      <Column field="status" :header="t('status')" />
      <Column v-if="mode === 'review' || mode === 'list'" field="artist.displayName" :header="t('artist')" />
      <Column :header="t('price')">
        <template #body="{ data }">{{ data.price }} RON</template>
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
          </div>
          <p
            v-if="data.pendingProposal"
            class="text-xs h-color-lunar-green mt-2"
          >
            {{ t("pendingProposal") }}:
            <span v-if="data.pendingProposal.changes.price">
              {{ t("price") }} → {{ data.pendingProposal.changes.price }} RON
            </span>
          </p>
        </template>
      </Column>
    </DataTable>
  </div>
</template>

<script setup lang="ts">
import DataTable from "primevue/datatable";
import Column from "primevue/column";
import Button from "primevue/button";
import type { AdminProduct } from "~/types/product";

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

const { t } = useI18n({ useScope: "local" });
const localePath = useLocalePath();
const router = useRouter();

const editProduct = (product: AdminProduct) => {
  router.push(localePath(`/admin/produse/${product.id}/editare`));
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
    "actions": "Acțiuni",
    "edit": "Editează",
    "submit": "Trimite la review",
    "acceptChanges": "Acceptă modificări",
    "approve": "Aprobă",
    "reject": "Respinge",
    "pendingProposal": "Propunere în așteptare"
  },
  "en": {
    "title": "Title",
    "status": "Status",
    "artist": "Artist",
    "price": "Price",
    "actions": "Actions",
    "edit": "Edit",
    "submit": "Submit for review",
    "acceptChanges": "Accept changes",
    "approve": "Approve",
    "reject": "Reject",
    "pendingProposal": "Pending proposal"
  }
}
</i18n>
