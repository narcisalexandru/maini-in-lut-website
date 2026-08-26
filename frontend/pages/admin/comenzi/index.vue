<template>
  <div>
    <h1 class="text-2xl font-bold h-color-lunar-green mb-6">{{ t("title") }}</h1>
    <AdminOrdersPanel
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
