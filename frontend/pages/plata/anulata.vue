<template>
  <div class="maini-ui__section md:px-4">
    <div v-if="verifying" class="maini-ui__container-products py-16 text-center max-w-lg mx-auto">
      <i class="ph ph-circle-notch animate-spin text-5xl h-color-primary block mb-4"></i>
      <h2 class="text-xl font-bold h-color-lunar-green mb-2">{{ t("verifyingTitle") }}</h2>
      <p class="text-gray-600 text-sm">{{ t("verifyingMessage") }}</p>
    </div>

    <div v-else class="maini-ui__container-products py-12 text-center max-w-lg mx-auto">
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
import { getApiBaseUrl } from "~/utils/api-base";

defineI18nRoute({
  paths: {
    ro: "/plata/anulata",
    en: "/plata/anulata",
  },
});

const { t } = useI18n({ useScope: "local" });
const route = useRoute();
const router = useRouter();
const localePath = useLocalePath();
const { clearCart } = useCart();

const verifying = ref(true);

onMounted(async () => {
  const queryOrderId = (route.query.orderId || route.query.orderID || route.query.order_id);
  const storedOrderId = import.meta.client ? sessionStorage.getItem("last_checkout_order_id") : null;
  const orderId = (typeof queryOrderId === "string" && queryOrderId.trim()) ? queryOrderId.trim() : storedOrderId;

  if (orderId) {
    try {
      for (let attempt = 0; attempt < 8; attempt += 1) {
        const res = await fetch(
          `${getApiBaseUrl()}/checkout/order-status/${encodeURIComponent(orderId)}`,
          { cache: "no-store" },
        );
        if (res.ok) {
          const data = await res.json();
          if (String(data?.paymentStatus || "").toLowerCase() === "paid") {
            await clearCart();
            if (import.meta.client) {
              sessionStorage.removeItem("last_checkout_order_id");
            }
            await router.replace(localePath(`/plata/succes?orderId=${encodeURIComponent(orderId)}`));
            return;
          }
        }
        await new Promise((resolve) => setTimeout(resolve, 400));
      }
    } catch {
      // Continue to show cancelled UI on check failure
    }
  }

  verifying.value = false;
});
</script>

<i18n lang="json">
{
  "en": {
    "breadcrumb": {
      "home": "Home",
      "cancelled": "Payment cancelled"
    },
    "verifyingTitle": "Checking payment status...",
    "verifyingMessage": "Please wait a moment while we verify your transaction status.",
    "title": "Payment cancelled",
    "message": "You cancelled the payment. Your cart has been preserved. You can complete the order whenever you want.",
    "backToCart": "Back to cart"
  },
  "ro": {
    "breadcrumb": {
      "home": "Acasă",
      "cancelled": "Plată anulată"
    },
    "verifyingTitle": "Verificăm starea plății...",
    "verifyingMessage": "Te rugăm să aștepți câteva momente cât timp verificăm starea tranzacției tale.",
    "title": "Plata a fost anulată",
    "message": "Ai anulat plata. Coșul tău a rămas neschimbat. Poți finaliza comanda oricând.",
    "backToCart": "Înapoi la coș"
  }
}
</i18n>
