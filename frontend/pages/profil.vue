<template>
  <section class="maini__section"></section>
</template>

<script setup>
defineI18nRoute({
  paths: {
    ro: "/profil",
    en: "/profile",
  },
});

const { t } = useI18n({
  useScope: "local",
});
</script>

<i18n lang="json">
{
  "en": {
    "profil": "Profile"
  },
  "ro": {
    "profil": "Profil"
  }
}
</i18n>
