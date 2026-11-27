<template>
  <div class="maini-ui__section md:px-4">
    <div class="maini-ui__container-products py-10 md:py-14">
      <nav class="mb-8 flex justify-center text-sm h-color-dusty-gray" aria-label="Breadcrumb">
        <ol class="flex flex-wrap items-center gap-1">
          <li>
            <NuxtLink :to="$localePath('/')" class="hover:h-color-primary">
              {{ t("breadcrumb.home") }}
            </NuxtLink>
          </li>
          <li><span class="mx-1">/</span></li>
          <li>
            <span class="h-color-lunar-green font-medium">{{ t("breadcrumb.success") }}</span>
          </li>
        </ol>
      </nav>

      <div class="mx-auto max-w-2xl text-center">
        <div class="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-[#e7efe2] text-[#3f5134]">
          <i class="ph ph-check-circle text-4xl" aria-hidden="true"></i>
        </div>
        <h1 class="text-2xl md:text-3xl font-bold h-color-lunar-green mb-3">
          {{ t("title") }}
        </h1>
        <p class="text-gray-600 leading-relaxed">
          {{ t("message") }}
        </p>

        <div class="mt-8 flex flex-col sm:flex-row items-stretch sm:items-center justify-center gap-3">
          <NuxtLink
            :to="$localePath('/')"
            class="inline-flex h-12 items-center justify-center gap-2 rounded-lg border border-[#6f825d] bg-white px-6 text-sm font-semibold text-[#3f5134] transition-colors hover:bg-[#f4f7f2]"
          >
            <i class="ph ph-house text-base" aria-hidden="true"></i>
            {{ t("home") }}
          </NuxtLink>
          <NuxtLink
            :to="$localePath('/produse')"
            class="inline-flex h-12 items-center justify-center gap-2 rounded-lg bg-[#6f825d] px-6 text-sm font-semibold text-white transition-colors hover:bg-[#5d6e4e]"
          >
            <i class="ph ph-storefront text-base" aria-hidden="true"></i>
            {{ t("products") }}
          </NuxtLink>
        </div>
      </div>

      <section v-if="recommendedProducts.length > 0" class="mt-16">
        <div class="mb-6 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <h2 class="mb-1 text-2xl font-bold h-color-lunar-green">{{ t("recommendedTitle") }}</h2>
            <p class="text-sm text-gray-600">{{ t("recommendedSubtitle") }}</p>
          </div>
          <NuxtLink
            :to="$localePath('/produse')"
            class="text-sm font-semibold uppercase h-color-primary hover:underline"
          >
            {{ t("viewAllCollection") }}
          </NuxtLink>
        </div>
        <div class="grid grid-cols-2 gap-4 lg:grid-cols-4 lg:gap-6">
          <ProductCard
            v-for="product in recommendedProducts"
            :key="product.id"
            :product="product"
          />
        </div>
      </section>
    </div>
  </div>
</template>

<script setup>
import { apiRequest } from "~/utils/api-request";
import { sortInStockFirst } from "~/utils/product-stock";
import { getApiBaseUrl } from "~/utils/api-base";

defineI18nRoute({
  paths: {
    ro: "/plata/succes",
    en: "/plata/succes",
  },
});

const { t } = useI18n({ useScope: "local" });
const route = useRoute();
const { clearCart } = useCart();

const products = ref([]);

const recommendedProducts = computed(() => sortInStockFirst(products.value).slice(0, 4));

useSeoMeta({
  title: () => t("title"),
  description: () => t("message"),
});

onMounted(async () => {
  await clearCart();

  const queryOrderId = route.query.orderId || route.query.orderID || route.query.order_id;
  const orderId = typeof queryOrderId === "string" ? queryOrderId.trim() : "";
  const storedOrderId = import.meta.client ? sessionStorage.getItem("last_checkout_order_id") : null;
  const confirmedOrderId = orderId || storedOrderId;
  if (confirmedOrderId) {
    try {
      await fetch(`${getApiBaseUrl()}/checkout/order-status/${encodeURIComponent(confirmedOrderId)}`);
    } catch {
      // background verification best-effort
    }
    if (import.meta.client) {
      sessionStorage.removeItem("last_checkout_order_id");
    }
  }

  try {
    const response = await apiRequest("/products");
    if (response.ok) {
      const data = await response.json();
      products.value = Array.isArray(data) ? data : [];
    }
  } catch (error) {
    console.error("Failed to load recommended products:", error);
  }
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
    "products": "Continue shopping",
    "recommendedTitle": "You might also like",
    "recommendedSubtitle": "Other pieces crafted with the same care.",
    "viewAllCollection": "View full collection"
  },
  "ro": {
    "breadcrumb": {
      "home": "Acasă",
      "success": "Plată reușită"
    },
    "title": "Mulțumim pentru comandă",
    "message": "Plata a fost efectuată cu succes. Vom procesa comanda și te vom contacta dacă este cazul.",
    "home": "Acasă",
    "products": "Continuă cumpărăturile",
    "recommendedTitle": "S-ar putea să-ți placă și asta",
    "recommendedSubtitle": "Alte piese lucrate cu aceeași grijă.",
    "viewAllCollection": "Vezi toată colecția"
  }
}
</i18n>
