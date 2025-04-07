<template>
  <div>
    <h1>Cos</h1>
  </div>
</template>

<script setup>
defineI18nRoute({
  paths: {
    ro: "/cos",
    en: "/cart",
  },
});

const { t } = useI18n({
  useScope: "local",
});
</script>
