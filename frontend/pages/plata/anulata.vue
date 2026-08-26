<template>
  <div class="maini-ui__section md:px-4">
    <div class="maini-ui__container-products py-12 text-center max-w-lg mx-auto">
      <nav
        class="flex mb-6 text-sm h-color-dusty-gray justify-center"
        aria-label="Breadcrumb"
      >
        <ol class="flex flex-wrap items-center gap-1">
          <li>
            <NuxtLink :to="$localePath('/')" class="hover:h-color-primary">
              {{ t("breadcrumb.home") }}
            </NuxtLink>
          </li>
          <li><span class="mx-1">/</span></li>
          <li>
            <span class="h-color-lunar-green font-medium">{{
              t("breadcrumb.cancelled")
            }}</span>
          </li>
        </ol>
      </nav>
      <i
        class="ph ph-x-circle text-6xl mb-4 text-gray-400 block"
      ></i>
      <h1 class="text-2xl md:text-3xl font-bold h-color-lunar-green mb-2">
        {{ t("title") }}
      </h1>
      <p class="text-gray-600 mb-6">
        {{ t("message") }}
      </p>
      <NuxtLink
        :to="$localePath('cos')"
        class="maini-ui-button__buy inline-flex items-center gap-2 px-6 py-3 rounded-lg font-semibold"
      >
        <i class="ph ph-shopping-cart"></i>
        {{ t("backToCart") }}
      </NuxtLink>
    </div>
  </div>
</template>

<script setup>
defineI18nRoute({
  paths: {
    ro: "/plata/anulata",
    en: "/plata/anulata",
  },
});

const { t } = useI18n({ useScope: "local" });
</script>

<i18n lang="json">
{
  "en": {
    "breadcrumb": {
      "home": "Home",
      "cancelled": "Payment cancelled"
    },
    "title": "Payment cancelled",
    "message": "You cancelled the payment. Your cart has been preserved. You can complete the order whenever you want.",
    "backToCart": "Back to cart"
  },
  "ro": {
    "breadcrumb": {
      "home": "Acasă",
      "cancelled": "Plată anulată"
    },
    "title": "Plata a fost anulată",
    "message": "Ai anulat plata. Coșul tău a rămas neschimbat. Poți finaliza comanda oricând.",
    "backToCart": "Înapoi la coș"
  }
}
</i18n>
