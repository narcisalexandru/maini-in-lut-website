<template>
  <div>
    <h1>{{ t("produse") }}</h1>
  </div>
</template>
<script setup>
defineI18nRoute({
  paths: {
    ro: "/produse",
    en: "/products",
  },
});

const { t } = useI18n({
  useScope: "local",
});
</script>

<i18n lang="json">
{
  "en": {
    "produse": "Products"
  },
  "ro": {
    "produse": "Produse"
  }
}
</i18n>
