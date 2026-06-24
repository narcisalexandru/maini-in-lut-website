<template>
  <div>
    <div
      class="mb-6 p-4 md:p-5 rounded-xl border-2 border-amber-600 bg-amber-50 shadow-sm"
    >
      <div class="flex items-start gap-3">
        <i class="ph ph-scroll text-3xl text-amber-700 shrink-0 mt-0.5"></i>
        <div>
          <h1 class="text-2xl font-bold text-amber-950">{{ t("title") }}</h1>
          <p class="text-sm text-amber-900 mt-1">{{ t("subtitle") }}</p>
          <p class="text-xs text-amber-800 mt-2 font-medium">{{ t("restricted") }}</p>
        </div>
      </div>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-4 gap-3 mb-4">
      <div class="flex flex-col gap-1">
        <label class="text-sm h-color-lunar-green">{{ t("filterSuperAdmin") }}</label>
        <Select
          v-model="superAdminFilter"
          :options="superAdminOptions"
          option-label="label"
          option-value="value"
          show-clear
          :placeholder="t('all')"
        />
      </div>
      <div class="flex flex-col gap-1">
        <label class="text-sm h-color-lunar-green">{{ t("filterArtist") }}</label>
        <Select
          v-model="artistFilter"
          :options="artistOptions"
          option-label="label"
          option-value="value"
          show-clear
          filter
          :placeholder="t('all')"
        />
      </div>
      <div class="flex flex-col gap-1">
        <label class="text-sm h-color-lunar-green">{{ t("filterActorRole") }}</label>
        <Select
          v-model="actorRoleFilter"
          :options="actorRoleOptions"
          option-label="label"
          option-value="value"
          show-clear
          :placeholder="t('all')"
        />
      </div>
      <div class="flex flex-col gap-1">
        <label class="text-sm h-color-lunar-green">{{ t("filterAction") }}</label>
        <Select
          v-model="actionFilter"
          :options="actionOptions"
          option-label="label"
          option-value="value"
          show-clear
          filter
          :placeholder="t('all')"
        />
      </div>
    </div>

    <div class="flex flex-col md:flex-row gap-3 mb-6">
      <div class="flex flex-col gap-1 flex-1">
        <label class="text-sm h-color-lunar-green">{{ t("search") }}</label>
        <InputText v-model="searchFilter" :placeholder="t('searchPlaceholder')" />
      </div>
      <div class="flex items-end">
        <Button
          v-if="hasActiveFilters"
          severity="secondary"
          outlined
          :label="t('clear')"
          icon="ph ph-x"
          @click="clearFilters"
        />
      </div>
    </div>

    <div v-if="loading" class="flex justify-center py-12">
      <i class="ph ph-spinner text-3xl animate-spin h-color-primary"></i>
    </div>

    <DataTable v-else :value="filteredLogs" striped-rows class="text-sm">
      <Column :header="t('when')">
        <template #body="{ data }">
          {{ formatDate(data.createdAt) }}
        </template>
      </Column>
      <Column :header="t('actor')">
        <template #body="{ data }">
          <div class="font-medium">{{ data.actorName }}</div>
          <div class="text-xs h-color-lunar-green">{{ data.actorEmail }}</div>
          <Tag
            :value="data.actorRole === 'SUPER_ADMIN' ? t('roleSuperAdmin') : t('roleArtist')"
            :severity="data.actorRole === 'SUPER_ADMIN' ? 'warn' : 'info'"
            class="mt-1"
          />
        </template>
      </Column>
      <Column :header="t('action')">
        <template #body="{ data }">
          <Tag
            :value="actionLabel(data.action)"
            :severity="actionSeverity(data.action)"
          />
        </template>
      </Column>
      <Column :header="t('artist')">
        <template #body="{ data }">
          {{ data.relatedArtistName || "—" }}
        </template>
      </Column>
      <Column :header="t('target')">
        <template #body="{ data }">
          <div>{{ data.targetLabel || "—" }}</div>
          <div class="text-xs h-color-lunar-green">{{ data.targetType }}</div>
        </template>
      </Column>
      <Column :header="t('details')">
        <template #body="{ data }">
          <span v-if="formatMetadata(data.metadata)" class="whitespace-pre-wrap text-xs">
            {{ formatMetadata(data.metadata) }}
          </span>
          <span v-else>—</span>
        </template>
      </Column>
    </DataTable>

    <p v-if="!loading && !filteredLogs.length" class="text-center h-color-lunar-green py-8">
      {{ t("empty") }}
    </p>
  </div>
</template>

<script setup>
import DataTable from "primevue/datatable";
import Column from "primevue/column";
import Select from "primevue/select";
import InputText from "primevue/inputtext";
import Button from "primevue/button";
import Tag from "primevue/tag";
import { useToast } from "primevue/usetoast";

definePageMeta({
  layout: "admin",
  middleware: ["auth", "admin", "super-admin"],
});

defineI18nRoute({
  paths: {
    ro: "/admin/jurnal",
    en: "/admin/audit-log",
  },
});

const { t, locale } = useI18n({ useScope: "local" });
const toast = useToast();
const { getFilterOptions, listAuditLogs } = useAuditLog();

const logs = ref([]);
const filterOptions = ref(null);
const loading = ref(true);
const searchFilter = ref("");
const superAdminFilter = ref(null);
const artistFilter = ref(null);
const actorRoleFilter = ref(null);
const actionFilter = ref(null);

const POSITIVE_ACTIONS = new Set([
  "ARTIST_APPROVED",
  "ARTIST_REACTIVATED",
  "PRODUCT_APPROVED",
  "PRODUCT_CHANGES_ACCEPTED",
  "PRODUCT_CREATED",
]);

const NEGATIVE_ACTIONS = new Set([
  "ARTIST_REJECTED",
  "ARTIST_SUSPENDED",
  "ARTIST_DELETED",
  "PRODUCT_REJECTED",
  "PRODUCT_CHANGES_REJECTED",
]);

const actionLabel = (action) => {
  const key = `action.${action}`;
  const translated = t(key);
  return translated === key ? action : translated;
};

const actionSeverity = (action) => {
  if (POSITIVE_ACTIONS.has(action)) return "success";
  if (NEGATIVE_ACTIONS.has(action)) return "danger";
  return "warn";
};

const superAdminOptions = computed(() =>
  (filterOptions.value?.superAdmins ?? []).map((admin) => ({
    label: `${admin.name} (${admin.email})`,
    value: admin.id,
  })),
);

const artistOptions = computed(() =>
  (filterOptions.value?.artists ?? []).map((artist) => ({
    label: artist.displayName,
    value: artist.id,
  })),
);

const actorRoleOptions = computed(() => [
  { label: t("roleSuperAdmin"), value: "SUPER_ADMIN" },
  { label: t("roleArtist"), value: "ARTIST" },
]);

const actionOptions = computed(() =>
  (filterOptions.value?.actions ?? []).map((action) => ({
    label: actionLabel(action),
    value: action,
  })),
);

const hasActiveFilters = computed(
  () =>
    Boolean(
      searchFilter.value.trim() ||
        superAdminFilter.value ||
        artistFilter.value ||
        actorRoleFilter.value ||
        actionFilter.value,
    ),
);

const filteredLogs = computed(() => {
  const query = searchFilter.value.trim().toLowerCase();
  if (!query) return logs.value;

  return logs.value.filter((entry) => {
    const haystack = [
      entry.actorName,
      entry.actorEmail,
      entry.relatedArtistName,
      entry.targetLabel,
      entry.action,
      entry.targetType,
      formatMetadata(entry.metadata),
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();

    return haystack.includes(query);
  });
});

const formatMetadata = (metadata) => {
  if (!metadata || !Object.keys(metadata).length) return "";
  if (metadata.reason) return `${t("reason")}: ${metadata.reason}`;
  if (metadata.message) return `${t("message")}: ${metadata.message}`;
  if (metadata.status) return `${t("status")}: ${metadata.status}`;
  return JSON.stringify(metadata, null, 2);
};

const formatDate = (value) =>
  new Date(value).toLocaleString(locale.value === "en" ? "en-GB" : "ro-RO");

const clearFilters = () => {
  searchFilter.value = "";
  superAdminFilter.value = null;
  artistFilter.value = null;
  actorRoleFilter.value = null;
  actionFilter.value = null;
};

const loadLogs = async () => {
  loading.value = true;
  try {
    logs.value = await listAuditLogs({
      actorUserId: superAdminFilter.value || undefined,
      relatedArtistId: artistFilter.value || undefined,
      actorRole: actorRoleFilter.value || undefined,
      action: actionFilter.value || undefined,
    });
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

watch([superAdminFilter, artistFilter, actorRoleFilter, actionFilter], loadLogs);

onMounted(async () => {
  try {
    filterOptions.value = await getFilterOptions();
  } catch (error) {
    toast.add({
      severity: "error",
      summary: t("error"),
      detail: error.message,
      life: 4000,
    });
  }
  await loadLogs();
});
</script>

<i18n lang="json">
{
  "ro": {
    "title": "Jurnal activitate admin",
    "subtitle": "Istoric complet al acțiunilor făcute în panoul de administrare de super-admini și artiști.",
    "restricted": "Acces restricționat — doar super-administratori.",
    "filterSuperAdmin": "Super-administrator",
    "filterArtist": "Artist / atelier",
    "filterActorRole": "Tip utilizator",
    "filterAction": "Tip acțiune",
    "search": "Căutare",
    "searchPlaceholder": "Caută după nume, email, artist, produs...",
    "all": "Toate",
    "clear": "Resetează filtre",
    "when": "Data",
    "actor": "Cine a făcut",
    "action": "Acțiune",
    "artist": "Artist vizat",
    "target": "Țintă",
    "details": "Detalii",
    "empty": "Nicio înregistrare nu corespunde filtrelor.",
    "error": "Eroare",
    "roleSuperAdmin": "Super-admin",
    "roleArtist": "Artist",
    "reason": "Motiv",
    "message": "Mesaj",
    "status": "Status",
    "action.ARTIST_APPROVED": "Artist aprobat",
    "action.ARTIST_REJECTED": "Cerere artist respinsă",
    "action.ARTIST_SUSPENDED": "Artist suspendat",
    "action.ARTIST_REACTIVATED": "Artist reactivat",
    "action.ARTIST_DELETED": "Cont artist șters",
    "action.PRODUCT_CREATED": "Produs creat",
    "action.PRODUCT_UPDATED": "Produs actualizat",
    "action.PRODUCT_SUBMITTED": "Produs trimis la validare",
    "action.PRODUCT_APPROVED": "Produs aprobat",
    "action.PRODUCT_REJECTED": "Produs respins",
    "action.PRODUCT_CHANGES_PROPOSED": "Modificări propuse produs",
    "action.PRODUCT_CHANGES_ACCEPTED": "Modificări acceptate",
    "action.PRODUCT_CHANGES_REJECTED": "Modificări respinse",
    "action.ORDER_ITEM_STATUS_UPDATED": "Status comandă actualizat"
  },
  "en": {
    "title": "Admin activity log",
    "subtitle": "Full history of actions in the admin panel by super-admins and artists.",
    "restricted": "Restricted access — super-admins only.",
    "filterSuperAdmin": "Super-administrator",
    "filterArtist": "Artist / studio",
    "filterActorRole": "User type",
    "filterAction": "Action type",
    "search": "Search",
    "searchPlaceholder": "Search by name, email, artist, product...",
    "all": "All",
    "clear": "Clear filters",
    "when": "Date",
    "actor": "Performed by",
    "action": "Action",
    "artist": "Related artist",
    "target": "Target",
    "details": "Details",
    "empty": "No entries match the current filters.",
    "error": "Error",
    "roleSuperAdmin": "Super-admin",
    "roleArtist": "Artist",
    "reason": "Reason",
    "message": "Message",
    "status": "Status",
    "action.ARTIST_APPROVED": "Artist approved",
    "action.ARTIST_REJECTED": "Artist application rejected",
    "action.ARTIST_SUSPENDED": "Artist suspended",
    "action.ARTIST_REACTIVATED": "Artist reactivated",
    "action.ARTIST_DELETED": "Artist account deleted",
    "action.PRODUCT_CREATED": "Product created",
    "action.PRODUCT_UPDATED": "Product updated",
    "action.PRODUCT_SUBMITTED": "Product submitted for review",
    "action.PRODUCT_APPROVED": "Product approved",
    "action.PRODUCT_REJECTED": "Product rejected",
    "action.PRODUCT_CHANGES_PROPOSED": "Product changes proposed",
    "action.PRODUCT_CHANGES_ACCEPTED": "Product changes accepted",
    "action.PRODUCT_CHANGES_REJECTED": "Product changes rejected",
    "action.ORDER_ITEM_STATUS_UPDATED": "Order item status updated"
  }
}
</i18n>
