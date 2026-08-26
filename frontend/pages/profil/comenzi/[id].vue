<template>
  <section class="maini-ui__section">
    <div class="maini-ui__container max-w-3xl">
      <NuxtLink
        :to="$localePath('/profil')"
        class="inline-flex items-center gap-2 text-sm h-color-lunar-green mb-4 hover:underline"
      >
        <i class="ph ph-arrow-left"></i>
        {{ t("back") }}
      </NuxtLink>

      <div v-if="loading" class="flex justify-center py-16">
        <i class="ph ph-spinner text-4xl animate-spin h-color-primary"></i>
      </div>

      <div v-else-if="order" class="h-bg-white rounded-xl shadow-md p-6 md:p-8">
        <div class="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
          <div>
            <h1 class="text-2xl font-bold h-color-lunar-green">
              {{ order.publicOrderNumber }}
            </h1>
            <p class="h-color-lunar-green text-sm mt-1">
              {{ formatDate(order.createdAt) }}
            </p>
          </div>
          <span class="rounded-xl px-4 py-1 text-sm bg-yellow-100 text-yellow-800 w-fit">
            {{ t(`payment.${order.paymentStatus}`) }}
          </span>
        </div>

        <h2 class="font-semibold h-color-palm-leaf mb-3">{{ t("items") }}</h2>
        <div
          v-for="item in order.items"
          :key="item.id"
          class="flex justify-between gap-4 border-b border-gray-100 py-3"
        >
          <div>
            <div class="font-medium">{{ item.title }}</div>
            <div class="text-sm h-color-lunar-green">
              {{ item.artistDisplayName }} · {{ item.quantity }} × {{ item.unitPriceRon }} RON
            </div>
          </div>
          <div class="text-right">
            <div class="font-medium">{{ item.lineTotalRon }} RON</div>
            <div class="text-sm h-color-lunar-green">
              {{ t(`itemStatus.${item.status}`) }}
            </div>
          </div>
        </div>

        <div class="mt-6 space-y-2 text-sm h-color-lunar-green">
          <div class="flex justify-between">
            <span>{{ t("subtotal") }}</span>
            <span>{{ order.subtotalRon }} RON</span>
          </div>
          <div class="flex justify-between">
            <span>{{ t("delivery") }}</span>
            <span>{{ order.deliveryFeeRon }} RON</span>
          </div>
          <div
            v-if="order.cashOperationalFeeRon > 0"
            class="flex justify-between"
          >
            <span>{{ t("cashFee") }}</span>
            <span>{{ order.cashOperationalFeeRon }} RON</span>
          </div>
          <div class="flex justify-between font-semibold text-base h-color-lunar-green pt-2">
            <span>{{ t("total") }}</span>
            <span>{{ order.totalRon }} RON</span>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup>
defineI18nRoute({
  paths: {
    ro: "/profil/comenzi/[id]",
    en: "/profile/orders/[id]",
  },
});

definePageMeta({
  middleware: ["auth"],
});

const route = useRoute();
const { t, locale } = useI18n({ useScope: "local" });
const { getMyOrder } = useOrders();

const order = ref(null);
const loading = ref(true);

const formatDate = (value) =>
  new Date(value).toLocaleDateString(locale.value === "en" ? "en-GB" : "ro-RO", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

onMounted(async () => {
  try {
    order.value = await getMyOrder(Number(route.params.id));
  } catch {
    order.value = null;
  } finally {
    loading.value = false;
  }
});
</script>

<i18n lang="json">
{
  "ro": {
    "back": "Înapoi la profil",
    "items": "Produse",
    "subtotal": "Subtotal",
    "delivery": "Livrare",
    "cashFee": "Taxă operațională ramburs",
    "total": "Total",
    "payment": {
      "PENDING": "Plată în așteptare",
      "PAID": "Plătit",
      "FAILED": "Plată eșuată"
    },
    "itemStatus": {
      "PENDING": "În așteptare",
      "PROCESSING": "În procesare",
      "SHIPPED": "Expediat",
      "DELIVERED": "Livrat",
      "CANCELLED": "Anulat"
    }
  },
  "en": {
    "back": "Back to profile",
    "items": "Items",
    "subtotal": "Subtotal",
    "delivery": "Delivery",
    "cashFee": "Cash on delivery fee",
    "total": "Total",
    "payment": {
      "PENDING": "Awaiting payment",
      "PAID": "Paid",
      "FAILED": "Payment failed"
    },
    "itemStatus": {
      "PENDING": "Pending",
      "PROCESSING": "Processing",
      "SHIPPED": "Shipped",
      "DELIVERED": "Delivered",
      "CANCELLED": "Cancelled"
    }
  }
}
</i18n>
