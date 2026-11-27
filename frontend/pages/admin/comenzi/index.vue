<template>
  <div class="flex min-h-0 flex-1 flex-col overflow-hidden">
    <h1 class="mb-2 shrink-0 text-xl font-bold h-color-lunar-green">{{ t("title") }}</h1>
    <AdminOrdersPanel
      contained
      :show-artist-filter="isSuperAdmin"
      :show-customer-links="isSuperAdmin"
    />
  </div>
</template>

<script setup>
import AdminOrdersPanel from "~/components/admin/AdminOrdersPanel.vue";

definePageMeta({
  layout: "admin",
  middleware: ["auth", "admin"],
});

const { t } = useI18n({ useScope: "local" });
const { loadUser, isSuperAdmin } = useAuth();

onMounted(loadUser);
</script>

<i18n lang="json">
{
  "ro": { "title": "Comenzi" },
  "en": { "title": "Orders" }
}
</i18n>
