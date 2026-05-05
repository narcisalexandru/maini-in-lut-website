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
              t("breadcrumb.success")
            }}</span>
          </li>
        </ol>
      </nav>
      <i
        class="ph ph-check-circle text-6xl mb-4 h-color-lunar-green block"
      ></i>
      <h1 class="text-2xl md:text-3xl font-bold h-color-lunar-green mb-2">
        {{ t("title") }}
      </h1>
      <p class="text-gray-600 mb-6">
        {{ t("message") }}
      </p>
      <div class="flex flex-wrap justify-center gap-3">
        <NuxtLink
          :to="$localePath('/')"
          class="maini-ui-button__buy inline-flex items-center gap-2 px-6 py-3 rounded-lg font-semibold"
        >
          <i class="ph ph-house"></i>
          {{ t("home") }}
        </NuxtLink>
        <NuxtLink
          :to="$localePath('/produse')"
          class="maini-ui-button inline-flex items-center gap-2 px-6 py-3 rounded-lg font-semibold"
        >
          <i class="ph ph-shopping-bag"></i>
          {{ t("products") }}
        </NuxtLink>
      </div>
    </div>
  </div>
</template>

<script setup>
defineI18nRoute({
  paths: {
    ro: "/plata/succes",
    en: "/plata/succes",
  },
});

const { t } = useI18n({ useScope: "local" });
const { loadCart } = useCart();

onMounted(() => {
  loadCart();
});
</script>

<i18n lang="json">
{
  "en": {
    "breadcrumb": {
      "home": "Home",
      "success": "Payment successful"
    },
    "title": "Thank you for your order",
    "message": "Your payment was successful. We will process your order and contact you if needed.",
    "home": "Home",
    "products": "Continue shopping"
  },
  "ro": {
    "breadcrumb": {
      "home": "Acasă",
      "success": "Plată reușită"
    },
    "title": "Mulțumim pentru comandă",
    "message": "Plata a fost efectuată cu succes. Vom procesa comanda și te vom contacta dacă este cazul.",
    "home": "Acasă",
    "products": "Continuă cumpărăturile"
  }
}
</i18n>
