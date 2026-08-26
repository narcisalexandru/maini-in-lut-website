<template>
  <div>
    <h1 class="text-2xl font-bold h-color-lunar-green mb-6">{{ t("title") }}</h1>

    <AdminFiltersBar
      :search="searchFilter"
      :status="null"
      :status-options="[]"
      :show-status-filter="false"
      :show-search="true"
      :search-placeholder="t('searchPlaceholder')"
      @update:search="searchFilter = $event"
      @clear="searchFilter = ''"
    />

    <div v-if="loading" class="flex justify-center py-12">
      <i class="ph ph-spinner text-3xl animate-spin h-color-primary"></i>
    </div>

    <DataTable v-else :value="filteredUsers" striped-rows class="text-sm">
      <Column :header="t('name')">
        <template #body="{ data }">
          {{ data.first_name }} {{ data.last_name }}
        </template>
      </Column>
      <Column field="email" :header="t('email')" />
      <Column field="phone" :header="t('phone')">
        <template #body="{ data }">{{ data.phone || "—" }}</template>
      </Column>
      <Column field="role" :header="t('role')" />
      <Column :header="t('actions')">
        <template #body="{ data }">
          <NuxtLink :to="localePath(`/admin/clienti/${data.id}`)">
            <Button size="small" severity="secondary" :label="t('view')" />
          </NuxtLink>
        </template>
      </Column>
    </DataTable>
  </div>
</template>

<script setup>
import DataTable from "primevue/datatable";
import Column from "primevue/column";
import Button from "primevue/button";
import AdminFiltersBar from "~/components/admin/AdminFiltersBar.vue";
import { useToast } from "primevue/usetoast";

definePageMeta({
  layout: "admin",
  middleware: ["auth", "admin", "super-admin"],
});

const { t } = useI18n({ useScope: "local" });
const toast = useToast();
const localePath = useLocalePath();
const { listUsers } = useUsers();

const users = ref([]);
const loading = ref(true);
const searchFilter = ref("");

const filteredUsers = computed(() => {
  const clients = users.value.filter((user) => user.role === "CLIENT");
  const query = searchFilter.value.trim().toLowerCase();
  if (!query) return clients;

  return clients.filter((user) => {
    const haystack = [
      user.first_name,
      user.last_name,
      user.email,
      user.phone,
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();
    return haystack.includes(query);
  });
});

onMounted(async () => {
  try {
    users.value = await listUsers();
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
});
</script>

<i18n lang="json">
{
  "ro": {
    "title": "Clienți",
    "searchPlaceholder": "Caută după nume sau email...",
    "name": "Nume",
    "email": "Email",
    "phone": "Telefon",
    "role": "Rol",
    "actions": "Acțiuni",
    "view": "Vezi",
    "error": "Eroare"
  },
  "en": {
    "title": "Customers",
    "searchPlaceholder": "Search by name or email...",
    "name": "Name",
    "email": "Email",
    "phone": "Phone",
    "role": "Role",
    "actions": "Actions",
    "view": "View",
    "error": "Error"
  }
}
</i18n>
