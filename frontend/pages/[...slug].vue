<template>
  <section class="maini-ui__section">
    <div class="maini-ui__container">
      <h1 class="maini-ui__heading text-center">{{ t("page-not-found") }}</h1>
      <div class="text-center mt-4">
        <NuxtLink :to="$localePath('/')" class="maini-ui-button__primary">
          {{ t("go-home") }}
        </NuxtLink>
      </div>
    </div>
  </section>
</template>

<script setup>
const { t } = useI18n({
  useScope: "local",
});
</script>

<i18n lang="json">
{
  "en": {
    "page-not-found": "Page Not Found",
    "go-home": "Go to Homepage"
  },
  "ro": {
    "page-not-found": "Pagina nu a fost găsită",
    "go-home": "Mergi la Pagina Principală"
  }
}
</i18n>
