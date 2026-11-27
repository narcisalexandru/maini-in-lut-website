<template>
  <div>
    <h1 class="mb-6 text-2xl font-bold h-color-lunar-green">{{ t("title") }}</h1>
    <WorkshopForm />
  </div>
</template>

<script setup lang="ts">
import WorkshopForm from "~/components/admin/WorkshopForm.vue";

definePageMeta({
  layout: "admin",
  middleware: ["auth", "admin"],
});

const { t } = useI18n({ useScope: "local" });
</script>

<i18n lang="json">
{
  "ro": { "title": "Atelier nou" },
  "en": { "title": "New workshop" }
}
</i18n>
