<template>
  <LegalDocumentPage
    :breadcrumb-current="t('breadcrumb.terms')"
    :title="t('title')"
    :last-updated="t('lastUpdated')"
    :sections="sections"
  >
    <template v-if="showBackToCheckout" #footer>
      <NuxtLink
        :to="backToHref"
        class="inline-flex items-center gap-2 text-sm font-medium h-color-palm-leaf hover:h-color-primary underline"
      >
        <i class="ph ph-arrow-left" aria-hidden="true"></i>
        {{ t("backToCheckout") }}
      </NuxtLink>
    </template>
  </LegalDocumentPage>
</template>

<script setup lang="ts">
import {
  roTermsSections,
  enTermsSections,
} from "~/content/terms-sections";

defineI18nRoute({
  paths: {
    ro: "/termeni-si-conditii",
    en: "/terms-and-conditions",
  },
});

const { t, locale } = useI18n({ useScope: "local" });
const route = useRoute();
const localePath = useLocalePath();

const showBackToCheckout = computed(
  () => route.query.step === "3",
);

const backToHref = computed(() =>
  localePath({ name: "cos", query: { step: "3" } }),
);

const sections = computed(() =>
  locale.value === "en" ? enTermsSections : roTermsSections,
);

useHead({
  title: () => t("metaTitle"),
  meta: [
    {
      name: "description",
      content: () => t("metaDescription"),
    },
  ],
});
</script>

<i18n lang="json">
{
  "ro": {
    "metaTitle": "Termeni și condiții | Mâini în lut",
    "metaDescription": "Termenii și condițiile magazinului online Mâini în lut: comenzi, plată, livrare, retururi și drepturile consumatorilor.",
    "breadcrumb": {
      "terms": "Termeni și condiții"
    },
    "title": "Termeni și condiții",
    "lastUpdated": "Ultima actualizare: iunie 2026",
    "backToCheckout": "Înapoi la finalizarea comenzii"
  },
  "en": {
    "metaTitle": "Terms and Conditions | Mâini în lut",
    "metaDescription": "Terms and conditions for the Mâini în lut online store: orders, payment, delivery, returns, and consumer rights.",
    "breadcrumb": {
      "terms": "Terms and Conditions"
    },
    "title": "Terms and Conditions",
    "lastUpdated": "Last updated: June 2026",
    "backToCheckout": "Back to checkout"
  }
}
</i18n>
