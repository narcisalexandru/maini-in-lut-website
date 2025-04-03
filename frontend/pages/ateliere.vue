<template>
  <div>
    <h1>{{ t("ateliere") }}</h1>
  </div>
</template>
<script setup>
defineI18nRoute({
  paths: {
    ro: "/ateliere",
    en: "/workshops",
  },
});

const { t } = useI18n({
  useScope: "local",
});
</script>

<i18n lang="json">
{
  "en": {
    "ateliere": "Workshops"
  },
  "ro": {
    "ateliere": "Ateliere"
  }
}
</i18n>
