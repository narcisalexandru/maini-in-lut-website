<template>
  <section class="maini-ui__section">
    <div class="maini-ui__container">
      <h2 class="h-font-size-48 flex items-center justify-center">
        {{ t("hello-message") }} Narcis
      </h2>
    </div>
  </section>
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
    "hello-message": "Hello",
    "profil": "Profile"
  },
  "ro": {
    "hello-message": "Bună",
    "profil": "Profil"
  }
}
</i18n>
