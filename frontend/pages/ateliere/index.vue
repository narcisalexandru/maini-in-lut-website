<template>
  <div class="maini-ui__section md:px-4">
    <div class="maini-ui__container-products py-8">
      <h1 class="text-3xl font-bold h-color-lunar-green mb-2">{{ t("title") }}</h1>
      <p class="text-gray-600 mb-8 max-w-2xl">{{ t("subtitle") }}</p>

      <div v-if="pending" class="flex justify-center py-16">
        <i class="ph ph-spinner text-4xl animate-spin h-color-primary"></i>
      </div>
      <p v-else-if="!workshops.length" class="h-color-lunar-green">{{ t("empty") }}</p>
      <div v-else class="grid gap-6 md:grid-cols-2">
        <article
          v-for="workshop in workshops"
          :key="workshop.id"
          class="rounded-xl bg-white p-6 shadow-sm"
        >
          <p class="text-sm h-color-primary font-medium mb-1">
            {{ workshop.artist.displayName }}
          </p>
          <h2 class="text-xl font-bold h-color-lunar-green mb-2">
            <NuxtLink :to="localePath(`/ateliere/${workshop.slug}`)">
              {{ workshop.title }}
            </NuxtLink>
          </h2>
          <p class="text-sm text-gray-600 mb-3">
            {{ formatWhen(workshop.startsAt) }} · {{ workshop.location }}
          </p>
          <p class="text-gray-700 line-clamp-3 mb-4">{{ workshop.description }}</p>
          <div class="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p class="font-semibold h-color-lunar-green">{{ formatFee(workshop.fee) }}</p>
              <p class="text-sm text-gray-500">{{ paymentLabel(workshop) }}</p>
            </div>
            <NuxtLink
              :to="localePath(`/ateliere/${workshop.slug}`)"
              class="inline-flex h-11 items-center rounded-lg bg-[#6f825d] px-4 text-sm font-semibold text-white"
            >
              {{ workshop.spotsLeft > 0 ? t("reserve") : t("full") }}
            </NuxtLink>
          </div>
        </article>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { apiRequest } from "~/utils/api-request";
import type { PublicWorkshop } from "~/types/workshop";

defineI18nRoute({
  paths: {
    ro: "/ateliere",
    en: "/workshops",
  },
});

const { t, locale } = useI18n({ useScope: "local" });
const localePath = useLocalePath();

useSeoMeta({
  title: () => t("title"),
  description: () => t("subtitle"),
});

const { data, pending } = await useAsyncData("public-workshops", async () => {
  const response = await apiRequest("/workshops");
  if (!response.ok) {
    return [] as PublicWorkshop[];
  }
  return (await response.json()) as PublicWorkshop[];
});

const workshops = computed(() => data.value || []);

function formatWhen(value: string) {
  return new Intl.DateTimeFormat(locale.value === "en" ? "en-GB" : "ro-RO", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function formatFee(fee: number) {
  return `${Number(fee).toFixed(2)} ${t("currency")}`;
}

function paymentLabel(workshop: PublicWorkshop) {
  if (workshop.allowCard && workshop.allowCash) return t("both");
  if (workshop.allowCard) return t("cardOnly");
  return t("cashOnly");
}
</script>

<i18n lang="json">
{
  "ro": {
    "title": "Ateliere",
    "subtitle": "Rezervă un loc la atelierul unui artist. Plătești online cu cardul sau numerar la locație, în funcție de opțiunile deschise de artist.",
    "empty": "Nu există ateliere programate momentan.",
    "reserve": "Vezi și rezervă",
    "full": "Locuri epuizate",
    "currency": "lei",
    "both": "Card sau numerar la locație",
    "cardOnly": "Doar card",
    "cashOnly": "Doar numerar la locație"
  },
  "en": {
    "title": "Workshops",
    "subtitle": "Reserve a seat at an artist's workshop. Pay online by card or in cash at the venue, depending on the options the artist opened.",
    "empty": "There are no workshops scheduled right now.",
    "reserve": "View and reserve",
    "full": "Sold out",
    "currency": "lei",
    "both": "Card or cash at the venue",
    "cardOnly": "Card only",
    "cashOnly": "Cash at the venue only"
  }
}
</i18n>
