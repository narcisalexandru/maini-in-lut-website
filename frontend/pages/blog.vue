<template>
  <div>
    <h1>{{ t("blog") }}</h1>
  </div>
</template>
<script setup>
defineI18nRoute({
  paths: {
    ro: "/blog",
    en: "/blog",
  },
});

const { t } = useI18n({
  useScope: "local",
});
</script>

<i18n lang="json">
{
  "en": {
    "blog": "Blog"
  },
  "ro": {
    "blog": "Blog"
  }
}
</i18n>
