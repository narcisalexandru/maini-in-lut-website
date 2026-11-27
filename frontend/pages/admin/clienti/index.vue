<template>
  <div>
    <h1 class="text-2xl font-bold h-color-lunar-green mb-6">{{ t("title") }}</h1>

    <AdminDataTable
      table-key="admin-customers"
      :rows="customerRows"
      :columns="columns"
      :loading="loading"
      track-changes
      :search-fields="['first_name', 'last_name', 'email', 'phone', 'city']"
      :search-placeholder="t('searchPlaceholder')"
      :empty-label="t('empty')"
      @changed="loadCustomers(true)"
    >
      <template #actions="{ row }">
        <NuxtLink :to="localePath(`/admin/clienti/${row.id}`)">
          <Button size="small" severity="secondary" :label="t('view')" />
        </NuxtLink>
      </template>
    </AdminDataTable>
  </div>
</template>

<script setup>
import Button from "primevue/button";
import AdminDataTable from "~/components/admin/AdminDataTable.vue";
import { useToast } from "primevue/usetoast";

definePageMeta({
  layout: "admin",
  middleware: ["auth", "admin", "super-admin"],
});

const { t } = useI18n({ useScope: "local" });
const toast = useToast();
const localePath = useLocalePath();
const { listUsers } = useUsers();
const { getAllOrders } = useOrders();

const users = ref([]);
const buyerIds = ref(new Set());
const loading = ref(true);

const customerRows = computed(() =>
  users.value
    .filter((user) => user.role === "CLIENT" || buyerIds.value.has(user.id))
    .map((user) => ({
      ...user,
      city: user.city || "",
      phone: user.phone || "",
      rowLabel: `${user.first_name} ${user.last_name}`.trim(),
    })),
);

const columns = computed(() => [
  {
    field: "first_name",
    header: t("firstName"),
    editable: "text",
    editKind: "customer-fields",
    minWidth: "10rem",
  },
  {
    field: "last_name",
    header: t("lastName"),
    editable: "text",
    editKind: "customer-fields",
    minWidth: "10rem",
  },
  { field: "email", header: t("email"), minWidth: "14rem" },
  {
    field: "phone",
    header: t("phone"),
    editable: "text",
    editKind: "customer-fields",
    minWidth: "10rem",
  },
  { field: "city", header: t("city"), minWidth: "9rem" },
]);

const loadCustomers = async (silent = false) => {
  if (!silent) loading.value = true;
  try {
    const [listed, activeOrders, archivedOrders] = await Promise.all([
      listUsers(),
      getAllOrders({ archived: false }),
      getAllOrders({ archived: true }),
    ]);
    users.value = listed;
    buyerIds.value = new Set(
      [...activeOrders, ...archivedOrders]
        .map((order) => order.userId)
        .filter((id) => typeof id === "number"),
    );
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

onMounted(loadCustomers);
</script>

<i18n lang="json">
{
  "ro": {
    "title": "Clienți",
    "searchPlaceholder": "Caută după nume sau email...",
    "firstName": "Prenume",
    "lastName": "Nume",
    "email": "Email",
    "phone": "Telefon",
    "city": "Oraș",
    "empty": "Niciun client nu corespunde filtrelor.",
    "actions": "Acțiuni",
    "view": "Vezi",
    "error": "Eroare"
  },
  "en": {
    "title": "Customers",
    "searchPlaceholder": "Search by name or email...",
    "firstName": "First name",
    "lastName": "Last name",
    "email": "Email",
    "phone": "Phone",
    "city": "City",
    "empty": "No customers match the current filters.",
    "actions": "Actions",
    "view": "View",
    "error": "Error"
  }
}
</i18n>
