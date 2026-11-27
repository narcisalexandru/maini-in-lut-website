<template>
  <div class="maini-ui__section md:px-4">
    <div class="maini-ui__container-products py-12">
      <div class="mx-auto max-w-xl text-center">
        <div v-if="loading" class="flex justify-center py-10">
          <i class="ph ph-spinner text-4xl animate-spin h-color-primary"></i>
        </div>
        <template v-else-if="status">
          <h1 class="text-3xl font-bold h-color-lunar-green mb-3">{{ heading }}</h1>
          <p class="text-gray-600 mb-2">{{ status.workshopTitle }}</p>
          <p class="text-gray-700">{{ detail }}</p>
          <p class="mt-4 text-sm text-gray-500">{{ status.code }}</p>
        </template>
        <template v-else>
          <h1 class="text-3xl font-bold h-color-lunar-green mb-3">{{ t("missing") }}</h1>
        </template>
        <NuxtLink :to="localePath('/ateliere')" class="mt-8 inline-flex h-11 items-center rounded-lg bg-[#6f825d] px-5 text-sm font-semibold text-white">
          {{ t("back") }}
        </NuxtLink>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { WorkshopBookingStatus } from "~/types/workshop";

defineI18nRoute({
  paths: {
    ro: "/ateliere/confirmare",
    en: "/workshops/confirmation",
  },
});

const route = useRoute();
const localePath = useLocalePath();
const { t } = useI18n({ useScope: "local" });
const { bookingStatus } = useWorkshops();

useSeoMeta({
  title: () => t("title"),
  robots: "noindex",
});

const status = ref<WorkshopBookingStatus | null>(null);
const loading = ref(true);

const heading = computed(() => {
  if (!status.value) return "";
  if (status.value.paymentStatus === "PAID") return t("paid");
  if (status.value.paymentStatus === "AWAITING_CASH") return t("cash");
  if (status.value.paymentStatus === "FAILED") return t("failed");
  return t("pending");
});

const detail = computed(() => {
  if (!status.value) return "";
  if (status.value.paymentStatus === "PAID") return t("paidDetail");
  if (status.value.paymentStatus === "AWAITING_CASH") return t("cashDetail");
  if (status.value.paymentStatus === "FAILED") return t("failedDetail");
  return t("pendingDetail");
});

onMounted(async () => {
  const code = String(route.query.code || "");
  if (!code) {
    loading.value = false;
    return;
  }
  for (let attempt = 0; attempt < 8; attempt += 1) {
    try {
      status.value = await bookingStatus(code);
      if (status.value.paymentStatus !== "PENDING") break;
    } catch {
      status.value = null;
      break;
    }
    await new Promise((resolve) => setTimeout(resolve, 2000));
  }
  loading.value = false;
});
</script>

<i18n lang="json">
{
  "ro": {
    "title": "Confirmare rezervare",
    "paid": "Locul este rezervat",
    "paidDetail": "Plata cu cardul a fost confirmată. Găsești detaliile și pe email.",
    "cash": "Locul este rezervat",
    "cashDetail": "Achiti taxa numerar, la locație, înainte de atelier.",
    "pending": "Verificăm plata",
    "pendingDetail": "Dacă ai finalizat plata cu cardul, confirmarea ajunge în câteva momente.",
    "failed": "Plata nu a fost finalizată",
    "failedDetail": "Locul nu a fost reținut. Poți încerca din nou din pagina atelierului.",
    "missing": "Nu am găsit rezervarea.",
    "back": "Înapoi la ateliere"
  },
  "en": {
    "title": "Reservation confirmation",
    "paid": "Your seat is reserved",
    "paidDetail": "The card payment is confirmed. The details are also in your email.",
    "cash": "Your seat is reserved",
    "cashDetail": "Pay the fee in cash at the venue, before the workshop starts.",
    "pending": "We are checking the payment",
    "pendingDetail": "If you finished the card payment, confirmation arrives in a few moments.",
    "failed": "The payment was not completed",
    "failedDetail": "The seat was not kept. You can try again from the workshop page.",
    "missing": "We could not find this reservation.",
    "back": "Back to workshops"
  }
}
</i18n>
