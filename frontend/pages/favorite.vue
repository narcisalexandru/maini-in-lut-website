<template>
  <div>
    <h1>Favorite</h1>
  </div>
</template>

<script setup>
defineI18nRoute({
  paths: {
    ro: "/favorite",
    en: "/favourite",
  },
});

const { t } = useI18n({
  useScope: "local",
});
</script>
