<template>
  <div>
    <h1 class="text-2xl font-bold h-color-lunar-green mb-6">{{ t("title") }}</h1>

    <AdminFiltersBar
      :search="searchFilter"
      :status="statusFilter"
      :status-options="artistStatusOptions"
      :search-placeholder="t('searchPlaceholder')"
      @update:search="searchFilter = $event"
      @update:status="statusFilter = $event"
      @clear="clearFilters"
    />

    <div v-if="loading" class="flex justify-center py-12">
      <i class="ph ph-spinner text-3xl animate-spin h-color-primary"></i>
    </div>

    <DataTable v-else :value="filteredArtists" striped-rows class="text-sm">
      <Column field="displayName" :header="t('name')" />
      <Column :header="t('email')">
        <template #body="{ data }">
          {{ data.user?.email || "—" }}
        </template>
      </Column>
      <Column :header="t('status')">
        <template #body="{ data }">
          {{ statusLabel(data.status) }}
        </template>
      </Column>
      <Column :header="t('actions')">
        <template #body="{ data }">
          <div class="flex flex-wrap gap-2">
            <NuxtLink :to="localePath(`/admin/artisti/${data.id}`)">
              <Button size="small" severity="secondary" :label="t('view')" />
            </NuxtLink>
            <template v-if="data.status === 'PENDING'">
              <Button
                size="small"
                :label="t('approve')"
                @click="handleApprove(data.id)"
              />
              <Button
                size="small"
                severity="danger"
                :label="t('reject')"
                @click="openReject(data)"
              />
            </template>
            <template v-else-if="data.status === 'APPROVED'">
              <Button
                size="small"
                severity="warn"
                :label="t('suspend')"
                @click="openSuspend(data)"
              />
              <Button
                size="small"
                severity="danger"
                :label="t('deleteAccount')"
                @click="openDelete(data)"
              />
            </template>
            <template v-else-if="data.status === 'SUSPENDED'">
              <Button
                size="small"
                :label="t('reactivate')"
                @click="handleReactivate(data.id)"
              />
              <Button
                size="small"
                severity="danger"
                :label="t('deleteAccount')"
                @click="openDelete(data)"
              />
            </template>
            <template v-else-if="data.status === 'REJECTED'">
              <Button
                size="small"
                severity="danger"
                :label="t('deleteAccount')"
                @click="openDelete(data)"
              />
            </template>
          </div>
        </template>
      </Column>
    </DataTable>

    <p
      v-if="!loading && !filteredArtists.length"
      class="text-center h-color-lunar-green py-8"
    >
      {{ t("empty") }}
    </p>

    <Dialog
      v-model:visible="rejectDialogVisible"
      modal
      :header="t('rejectTitle')"
      :style="{ width: '480px' }"
    >
      <div class="flex flex-col gap-2">
        <label class="text-sm h-color-lunar-green">{{ t("rejectReason") }}</label>
        <Textarea v-model="rejectReason" rows="4" class="w-full" />
      </div>
      <template #footer>
        <Button severity="secondary" :label="t('cancel')" @click="rejectDialogVisible = false" />
        <Button severity="danger" :label="t('reject')" @click="handleReject" />
      </template>
    </Dialog>

    <Dialog
      v-model:visible="suspendDialogVisible"
      modal
      :header="t('suspendTitle')"
      :style="{ width: '480px' }"
    >
      <div class="flex flex-col gap-2">
        <p class="text-sm h-color-lunar-green">{{ t("suspendConfirm") }}</p>
        <label class="text-sm h-color-lunar-green">{{ t("suspendReasonLabel") }}</label>
        <Textarea v-model="suspendReason" rows="4" class="w-full" />
      </div>
      <template #footer>
        <Button severity="secondary" :label="t('cancel')" @click="suspendDialogVisible = false" />
        <Button severity="warn" :label="t('suspend')" @click="handleSuspend" />
      </template>
    </Dialog>

    <Dialog
      v-model:visible="deleteDialogVisible"
      modal
      :header="t('deleteTitle')"
      :style="{ width: '480px' }"
    >
      <p class="text-sm h-color-lunar-green">{{ t("deleteConfirm") }}</p>
      <template #footer>
        <Button severity="secondary" :label="t('cancel')" @click="deleteDialogVisible = false" />
        <Button severity="danger" :label="t('deleteAccount')" @click="handleDelete" />
      </template>
    </Dialog>
  </div>
</template>

<script setup>
import DataTable from "primevue/datatable";
import Column from "primevue/column";
import Button from "primevue/button";
import Dialog from "primevue/dialog";
import Textarea from "primevue/textarea";
import AdminFiltersBar from "~/components/admin/AdminFiltersBar.vue";
import { useToast } from "primevue/usetoast";

definePageMeta({
  layout: "admin",
  middleware: ["auth", "admin", "super-admin"],
});

const { t } = useI18n({ useScope: "local" });
const localePath = useLocalePath();
const toast = useToast();
const { listArtists, approveArtist, rejectArtist, suspendArtist, reactivateArtist, deleteArtistAccount } = useArtist();

const artists = ref([]);
const loading = ref(true);
const searchFilter = ref("");
const statusFilter = ref(null);
const rejectDialogVisible = ref(false);
const suspendDialogVisible = ref(false);
const deleteDialogVisible = ref(false);
const rejectReason = ref("");
const suspendReason = ref("");
const selectedArtistId = ref(null);

const artistStatusOptions = computed(() => [
  { label: t("statusPending"), value: "PENDING" },
  { label: t("statusApproved"), value: "APPROVED" },
  { label: t("statusRejected"), value: "REJECTED" },
  { label: t("statusSuspended"), value: "SUSPENDED" },
]);

const statusLabel = (status) =>
  artistStatusOptions.value.find((option) => option.value === status)?.label ||
  status;

const filteredArtists = computed(() => {
  const query = searchFilter.value.trim().toLowerCase();
  if (!query) return artists.value;

  return artists.value.filter((artist) => {
    const haystack = [
      artist.displayName,
      artist.user?.email,
      artist.user?.first_name,
      artist.user?.last_name,
      artist.contactEmail,
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();

    return haystack.includes(query);
  });
});

const clearFilters = () => {
  searchFilter.value = "";
  statusFilter.value = null;
};

const loadArtists = async () => {
  loading.value = true;
  try {
    artists.value = await listArtists(statusFilter.value || undefined);
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

watch(statusFilter, () => {
  loadArtists();
});

const handleApprove = async (id) => {
  try {
    await approveArtist(id);
    toast.add({ severity: "success", summary: t("approved"), life: 3000 });
    await loadArtists();
  } catch (error) {
    toast.add({ severity: "error", summary: t("error"), detail: error.message, life: 4000 });
  }
};

const openReject = (artist) => {
  selectedArtistId.value = artist.id;
  rejectReason.value = "";
  rejectDialogVisible.value = true;
};

const handleReject = async () => {
  if (!rejectReason.value.trim()) return;
  try {
    await rejectArtist(selectedArtistId.value, rejectReason.value.trim());
    rejectDialogVisible.value = false;
    toast.add({ severity: "success", summary: t("rejected"), life: 3000 });
    await loadArtists();
  } catch (error) {
    toast.add({ severity: "error", summary: t("error"), detail: error.message, life: 4000 });
  }
};

const openSuspend = (artist) => {
  selectedArtistId.value = artist.id;
  suspendReason.value = "";
  suspendDialogVisible.value = true;
};

const handleSuspend = async () => {
  if (!suspendReason.value.trim()) return;
  try {
    await suspendArtist(selectedArtistId.value, suspendReason.value.trim());
    suspendDialogVisible.value = false;
    toast.add({ severity: "success", summary: t("suspended"), life: 3000 });
    await loadArtists();
  } catch (error) {
    toast.add({ severity: "error", summary: t("error"), detail: error.message, life: 4000 });
  }
};

const handleReactivate = async (id) => {
  try {
    await reactivateArtist(id);
    toast.add({ severity: "success", summary: t("reactivated"), life: 3000 });
    await loadArtists();
  } catch (error) {
    toast.add({ severity: "error", summary: t("error"), detail: error.message, life: 4000 });
  }
};

const openDelete = (artist) => {
  selectedArtistId.value = artist.id;
  deleteDialogVisible.value = true;
};

const handleDelete = async () => {
  try {
    await deleteArtistAccount(selectedArtistId.value);
    deleteDialogVisible.value = false;
    toast.add({ severity: "success", summary: t("deleted"), life: 3000 });
    await loadArtists();
  } catch (error) {
    toast.add({ severity: "error", summary: t("error"), detail: error.message, life: 4000 });
  }
};

onMounted(loadArtists);
</script>

<i18n lang="json">
{
  "ro": {
    "title": "Gestionare artiști",
    "searchPlaceholder": "Caută după nume sau email...",
    "name": "Atelier",
    "email": "Email",
    "status": "Status",
    "actions": "Acțiuni",
    "view": "Detalii",
    "approve": "Aprobă",
    "reject": "Respinge",
    "rejectTitle": "Respinge cererea",
    "rejectReason": "Motiv respingere",
    "cancel": "Anulare",
    "error": "Eroare",
    "approved": "Artist aprobat",
    "rejected": "Cerere respinsă",
    "suspend": "Suspendă",
    "suspendTitle": "Suspendă cont artist",
    "suspendConfirm": "Produsele artistului vor dispărea de pe site. Poți reactiva contul ulterior.",
    "suspendReasonLabel": "Motiv suspendare",
    "reactivate": "Reactivează",
    "deleteAccount": "Șterge cont",
    "deleteTitle": "Ștergere definitivă",
    "deleteConfirm": "Șterge contul, profilul de artist și toate produsele. Acțiunea este ireversibilă.",
    "suspended": "Cont suspendat",
    "reactivated": "Cont reactivat",
    "deleted": "Cont șters",
    "empty": "Niciun artist nu corespunde filtrelor.",
    "statusPending": "În așteptare",
    "statusApproved": "Aprobat",
    "statusRejected": "Respins",
    "statusSuspended": "Suspendat"
  },
  "en": {
    "title": "Manage artists",
    "searchPlaceholder": "Search by name or email...",
    "name": "Studio",
    "email": "Email",
    "status": "Status",
    "actions": "Actions",
    "view": "Details",
    "approve": "Approve",
    "reject": "Reject",
    "rejectTitle": "Reject application",
    "rejectReason": "Rejection reason",
    "cancel": "Cancel",
    "error": "Error",
    "approved": "Artist approved",
    "rejected": "Application rejected",
    "suspend": "Suspend",
    "suspendTitle": "Suspend artist account",
    "suspendConfirm": "The artist's products will be hidden from the site. You can reactivate the account later.",
    "suspendReasonLabel": "Suspension reason",
    "reactivate": "Reactivate",
    "deleteAccount": "Delete account",
    "deleteTitle": "Permanent deletion",
    "deleteConfirm": "Deletes the account, artist profile, and all products. This action cannot be undone.",
    "suspended": "Account suspended",
    "reactivated": "Account reactivated",
    "deleted": "Account deleted",
    "empty": "No artists match the current filters.",
    "statusPending": "Pending",
    "statusApproved": "Approved",
    "statusRejected": "Rejected",
    "statusSuspended": "Suspended"
  }
}
</i18n>
