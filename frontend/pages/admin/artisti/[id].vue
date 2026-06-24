<template>
  <div>
    <div class="flex items-center gap-3 mb-6">
      <NuxtLink
        :to="localePath('/admin/artisti')"
        class="text-sm h-color-lunar-green hover:underline flex items-center gap-1"
      >
        <i class="ph ph-arrow-left"></i>
        {{ t("back") }}
      </NuxtLink>
    </div>

    <div v-if="loading" class="flex justify-center py-12">
      <i class="ph ph-spinner text-3xl animate-spin h-color-primary"></i>
    </div>

    <div v-else-if="artist" class="space-y-6">
      <div class="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
        <div>
          <h1 class="text-2xl font-bold h-color-lunar-green">{{ artist.displayName }}</h1>
          <p class="text-sm h-color-lunar-green mt-1">{{ t("slug") }}: {{ artist.slug }}</p>
        </div>
        <Tag :value="artist.status" :severity="statusSeverity" />
      </div>

      <div class="h-bg-white rounded-xl shadow p-4 md:p-6 space-y-4">
        <h2 class="font-semibold h-color-lunar-green text-lg">{{ t("applicant") }}</h2>
        <dl class="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div>
            <dt class="font-medium h-color-lunar-green">{{ t("fullName") }}</dt>
            <dd>{{ applicantName }}</dd>
          </div>
          <div>
            <dt class="font-medium h-color-lunar-green">{{ t("email") }}</dt>
            <dd>
              <a
                v-if="artist.user?.email"
                :href="`mailto:${artist.user.email}`"
                class="text-blue-600 hover:underline"
              >
                {{ artist.user.email }}
              </a>
              <span v-else>—</span>
            </dd>
          </div>
          <div>
            <dt class="font-medium h-color-lunar-green">{{ t("phone") }}</dt>
            <dd>{{ artist.user?.phone || "—" }}</dd>
          </div>
          <div>
            <dt class="font-medium h-color-lunar-green">{{ t("appliedAt") }}</dt>
            <dd>{{ formatDate(artist.createdAt) }}</dd>
          </div>
        </dl>
      </div>

      <div class="h-bg-white rounded-xl shadow p-4 md:p-6 space-y-4">
        <h2 class="font-semibold h-color-lunar-green text-lg">{{ t("application") }}</h2>
        <dl class="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div>
            <dt class="font-medium h-color-lunar-green">{{ t("artistName") }}</dt>
            <dd>{{ artist.artistFirstName }} {{ artist.artistLastName }}</dd>
          </div>
          <div>
            <dt class="font-medium h-color-lunar-green">{{ t("displayName") }}</dt>
            <dd>{{ artist.displayName }}</dd>
          </div>
          <div>
            <dt class="font-medium h-color-lunar-green">{{ t("companyCui") }}</dt>
            <dd>{{ artist.companyCui || "—" }}</dd>
          </div>
          <div class="md:col-span-2">
            <dt class="font-medium h-color-lunar-green">{{ t("companyLegalName") }}</dt>
            <dd>{{ artist.companyLegalName || "—" }}</dd>
          </div>
          <div>
            <dt class="font-medium h-color-lunar-green">{{ t("contactEmail") }}</dt>
            <dd>
              <a
                v-if="artist.contactEmail"
                :href="`mailto:${artist.contactEmail}`"
                class="text-blue-600 hover:underline"
              >
                {{ artist.contactEmail }}
              </a>
              <span v-else>—</span>
            </dd>
          </div>
          <div>
            <dt class="font-medium h-color-lunar-green">{{ t("contactPhone") }}</dt>
            <dd>{{ artist.contactPhone || "—" }}</dd>
          </div>
        </dl>
        <div>
          <p class="font-medium h-color-lunar-green text-sm mb-1">{{ t("portfolio") }}</p>
          <a
            v-if="artist.portfolioUrl"
            :href="artist.portfolioUrl"
            target="_blank"
            rel="noopener noreferrer"
            class="text-blue-600 hover:underline text-sm break-all"
          >
            {{ artist.portfolioUrl }}
          </a>
          <p v-else class="text-sm">—</p>
        </div>
        <div v-if="artist.suspensionReason">
          <p class="font-medium h-color-lunar-green text-sm mb-1">{{ t("suspensionReason") }}</p>
          <p class="whitespace-pre-wrap text-sm text-red-700">{{ artist.suspensionReason }}</p>
        </div>
        <div v-if="artist.rejectionReason">
          <p class="font-medium h-color-lunar-green text-sm mb-1">{{ t("rejectionReason") }}</p>
          <p class="whitespace-pre-wrap text-sm">{{ artist.rejectionReason }}</p>
        </div>
      </div>

      <div v-if="artist.status === 'PENDING'" class="flex flex-wrap gap-2">
        <Button :label="t('approve')" @click="handleApprove" />
        <Button severity="danger" :label="t('reject')" @click="openReject" />
      </div>

      <div
        v-if="canManageAccount"
        class="h-bg-white rounded-xl shadow p-4 md:p-6 space-y-4"
      >
        <h2 class="font-semibold h-color-lunar-green text-lg">{{ t("accountManagement") }}</h2>
        <p class="text-sm h-color-lunar-green">{{ accountManagementHint }}</p>
        <div class="flex flex-wrap gap-2">
          <Button
            v-if="artist.status === 'APPROVED'"
            severity="warn"
            :label="t('suspend')"
            @click="openSuspend"
          />
          <Button
            v-if="artist.status === 'SUSPENDED'"
            :label="t('reactivate')"
            @click="handleReactivate"
          />
          <Button
            severity="danger"
            :label="t('deleteAccount')"
            @click="openDelete"
          />
        </div>
      </div>
    </div>
  </div>

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

  <Dialog
    v-model:visible="rejectDialogVisible"
    modal
    :header="t('rejectTitle')"
    :style="{ width: '480px' }"
  >
    <div class="flex flex-col gap-2">
      <label class="text-sm h-color-lunar-green">{{ t("rejectReasonLabel") }}</label>
      <Textarea v-model="rejectReason" rows="4" class="w-full" />
    </div>
    <template #footer>
      <Button severity="secondary" :label="t('cancel')" @click="rejectDialogVisible = false" />
      <Button severity="danger" :label="t('reject')" @click="handleReject" />
    </template>
  </Dialog>
</template>

<script setup>
import Tag from "primevue/tag";
import Button from "primevue/button";
import Dialog from "primevue/dialog";
import Textarea from "primevue/textarea";
import { useToast } from "primevue/usetoast";

definePageMeta({
  layout: "admin",
  middleware: ["auth", "admin", "super-admin"],
});

const route = useRoute();
const router = useRouter();
const localePath = useLocalePath();
const { t, locale } = useI18n({ useScope: "local" });
const toast = useToast();
const {
  getArtist,
  approveArtist,
  rejectArtist,
  suspendArtist,
  reactivateArtist,
  deleteArtistAccount,
} = useArtist();

const artist = ref(null);
const loading = ref(true);
const rejectDialogVisible = ref(false);
const suspendDialogVisible = ref(false);
const deleteDialogVisible = ref(false);
const rejectReason = ref("");
const suspendReason = ref("");

const artistId = computed(() => Number(route.params.id));

const canManageAccount = computed(() => {
  const status = artist.value?.status;
  return status === "APPROVED" || status === "SUSPENDED" || status === "REJECTED";
});

const accountManagementHint = computed(() => {
  switch (artist.value?.status) {
    case "APPROVED":
      return t("accountManagementApproved");
    case "SUSPENDED":
      return t("accountManagementSuspended");
    case "REJECTED":
      return t("accountManagementRejected");
    default:
      return "";
  }
});

const applicantName = computed(() => {
  if (!artist.value?.user) return "—";
  return `${artist.value.user.first_name} ${artist.value.user.last_name}`.trim();
});

const statusSeverity = computed(() => {
  switch (artist.value?.status) {
    case "APPROVED":
      return "success";
    case "PENDING":
      return "warn";
    case "REJECTED":
      return "danger";
    case "SUSPENDED":
      return "warn";
    default:
      return "secondary";
  }
});

const formatDate = (value) =>
  new Date(value).toLocaleString(locale.value === "en" ? "en-GB" : "ro-RO");

const loadArtist = async () => {
  loading.value = true;
  try {
    artist.value = await getArtist(artistId.value);
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

const handleApprove = async () => {
  try {
    await approveArtist(artistId.value);
    toast.add({ severity: "success", summary: t("approved"), life: 3000 });
    await loadArtist();
  } catch (error) {
    toast.add({ severity: "error", summary: t("error"), detail: error.message, life: 4000 });
  }
};

const openReject = () => {
  rejectReason.value = "";
  rejectDialogVisible.value = true;
};

const handleReject = async () => {
  if (!rejectReason.value.trim()) return;
  try {
    await rejectArtist(artistId.value, rejectReason.value.trim());
    rejectDialogVisible.value = false;
    toast.add({ severity: "success", summary: t("rejected"), life: 3000 });
    await loadArtist();
  } catch (error) {
    toast.add({ severity: "error", summary: t("error"), detail: error.message, life: 4000 });
  }
};

const openSuspend = () => {
  suspendReason.value = "";
  suspendDialogVisible.value = true;
};

const handleSuspend = async () => {
  if (!suspendReason.value.trim()) return;
  try {
    await suspendArtist(artistId.value, suspendReason.value.trim());
    suspendDialogVisible.value = false;
    toast.add({ severity: "success", summary: t("suspended"), life: 3000 });
    await loadArtist();
  } catch (error) {
    toast.add({ severity: "error", summary: t("error"), detail: error.message, life: 4000 });
  }
};

const handleReactivate = async () => {
  try {
    await reactivateArtist(artistId.value);
    toast.add({ severity: "success", summary: t("reactivated"), life: 3000 });
    await loadArtist();
  } catch (error) {
    toast.add({ severity: "error", summary: t("error"), detail: error.message, life: 4000 });
  }
};

const openDelete = () => {
  deleteDialogVisible.value = true;
};

const handleDelete = async () => {
  try {
    await deleteArtistAccount(artistId.value);
    deleteDialogVisible.value = false;
    toast.add({ severity: "success", summary: t("deleted"), life: 3000 });
    await router.push(localePath("/admin/artisti"));
  } catch (error) {
    toast.add({ severity: "error", summary: t("error"), detail: error.message, life: 4000 });
  }
};

onMounted(loadArtist);
</script>

<i18n lang="json">
{
  "ro": {
    "back": "Înapoi la listă",
    "slug": "Slug",
    "applicant": "Date solicitant",
    "fullName": "Nume complet",
    "email": "Email",
    "phone": "Telefon",
    "appliedAt": "Data cererii",
    "application": "Cerere de înscriere",
    "artistName": "Artist",
    "displayName": "Nume pe site",
    "companyCui": "CUI firmă",
    "companyLegalName": "Denumire legală firmă",
    "contactEmail": "Email contact",
    "contactPhone": "Telefon contact",
    "portfolio": "Portofoliu",
    "rejectionReason": "Motiv respingere",
    "approve": "Aprobă",
    "reject": "Respinge",
    "rejectTitle": "Respinge cererea",
    "rejectReasonLabel": "Motiv respingere",
    "cancel": "Anulare",
    "error": "Eroare",
    "approved": "Artist aprobat",
    "rejected": "Cerere respinsă",
    "accountManagement": "Gestionare cont",
    "accountManagementApproved": "Poți suspenda contul (produsele dispar de pe site) sau șterge definitiv contul artistului.",
    "accountManagementSuspended": "Contul este suspendat. Produsele sunt ascunse. Poți reactiva contul sau șterge definitiv datele.",
    "accountManagementRejected": "Cererea a fost respinsă. Poți șterge definitiv contul și datele asociate.",
    "suspend": "Suspendă",
    "suspendTitle": "Suspendă cont artist",
    "suspendConfirm": "Artistul nu va mai putea vinde, iar produsele lui vor dispărea de pe site. Poți reactiva contul ulterior.",
    "suspendReasonLabel": "Motiv suspendare",
    "suspensionReason": "Motiv suspendare",
    "reactivate": "Reactivează",
    "deleteAccount": "Șterge cont",
    "deleteTitle": "Ștergere definitivă",
    "deleteConfirm": "Această acțiune șterge contul utilizatorului, profilul de artist și toate produsele. Comenzile istorice rămân, dar fără legătura către artist. Acțiunea este ireversibilă.",
    "suspended": "Cont suspendat",
    "reactivated": "Cont reactivat",
    "deleted": "Cont șters"
  },
  "en": {
    "back": "Back to list",
    "slug": "Slug",
    "applicant": "Applicant details",
    "fullName": "Full name",
    "email": "Email",
    "phone": "Phone",
    "appliedAt": "Application date",
    "application": "Application",
    "artistName": "Artist",
    "displayName": "Name on site",
    "companyCui": "Company VAT ID",
    "companyLegalName": "Legal company name",
    "contactEmail": "Contact email",
    "contactPhone": "Contact phone",
    "portfolio": "Portfolio",
    "rejectionReason": "Rejection reason",
    "approve": "Approve",
    "reject": "Reject",
    "rejectTitle": "Reject application",
    "rejectReasonLabel": "Rejection reason",
    "cancel": "Cancel",
    "error": "Error",
    "approved": "Artist approved",
    "rejected": "Application rejected",
    "accountManagement": "Account management",
    "accountManagementApproved": "You can suspend the account (products are hidden from the site) or permanently delete the artist account.",
    "accountManagementSuspended": "The account is suspended and products are hidden. You can reactivate or permanently delete the account.",
    "accountManagementRejected": "The application was rejected. You can permanently delete the account and associated data.",
    "suspend": "Suspend",
    "suspendTitle": "Suspend artist account",
    "suspendConfirm": "The artist will no longer be able to sell and their products will be hidden from the site. You can reactivate the account later.",
    "suspendReasonLabel": "Suspension reason",
    "suspensionReason": "Suspension reason",
    "reactivate": "Reactivate",
    "deleteAccount": "Delete account",
    "deleteTitle": "Permanent deletion",
    "deleteConfirm": "This permanently deletes the user account, artist profile, and all products. Historical orders remain but are no longer linked to this artist. This action cannot be undone.",
    "suspended": "Account suspended",
    "reactivated": "Account reactivated",
    "deleted": "Account deleted"
  }
}
</i18n>
