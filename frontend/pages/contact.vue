<template>
  <div>
    <h1>{{ t("contact") }}</h1>
  </div>
</template>
<script setup>
defineI18nRoute({
  paths: {
    ro: "/contact",
    en: "/contact",
  },
});

const { t } = useI18n({
  useScope: "local",
});
</script>

<i18n lang="json">
{
  "en": {
    "contact": "Contact"
  },
  "ro": {
    "contact": "Contact"
  }
}
</i18n>
