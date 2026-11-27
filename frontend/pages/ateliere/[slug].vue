<template>
  <div class="maini-ui__section md:px-4">
    <div class="maini-ui__container-products py-8">
      <div v-if="pending" class="flex justify-center py-16">
        <i class="ph ph-spinner text-4xl animate-spin h-color-primary"></i>
      </div>
      <div v-else-if="workshop" class="grid gap-8 lg:grid-cols-[minmax(0,1fr)_22rem]">
        <article>
          <p class="text-sm mb-2">
            <NuxtLink :to="localePath('/ateliere')" class="h-color-primary">{{ t("back") }}</NuxtLink>
          </p>
          <p class="text-sm h-color-primary font-medium mb-1">
            <NuxtLink :to="localePath(`/atelier/${workshop.artist.slug}`)">
              {{ workshop.artist.displayName }}
            </NuxtLink>
          </p>
          <h1 class="text-3xl font-bold h-color-lunar-green mb-3">{{ workshop.title }}</h1>
          <p class="text-gray-600 mb-4">
            {{ formatWhen(workshop.startsAt) }}
            <template v-if="workshop.endsAt"> – {{ formatWhen(workshop.endsAt) }}</template>
            · {{ workshop.location }}
          </p>
          <p class="whitespace-pre-line text-gray-800 leading-relaxed">{{ workshop.description }}</p>
        </article>

        <aside class="h-fit rounded-xl bg-white p-6 shadow-sm">
          <p class="text-2xl font-bold h-color-lunar-green">{{ formatFee(workshop.fee) }}</p>
          <p class="text-sm text-gray-500 mb-4">{{ t("perPerson") }}</p>
          <p class="text-sm mb-4">{{ t("spotsLeft", { count: workshop.spotsLeft }) }}</p>

          <form v-if="canBook" class="space-y-3" @submit.prevent="submit">
            <div class="grid grid-cols-2 gap-3">
              <label class="block text-sm">
                {{ t("firstName") }}
                <input v-model="form.firstName" required maxlength="80" class="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2" />
              </label>
              <label class="block text-sm">
                {{ t("lastName") }}
                <input v-model="form.lastName" required maxlength="80" class="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2" />
              </label>
            </div>
            <label class="block text-sm">
              {{ t("email") }}
              <input v-model="form.email" type="email" required maxlength="180" class="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2" />
            </label>
            <label class="block text-sm">
              {{ t("phone") }}
              <input v-model="form.phone" required minlength="8" maxlength="32" class="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2" />
            </label>
            <label class="block text-sm">
              {{ t("spots") }}
              <input v-model.number="form.spots" type="number" min="1" :max="maxSpots" required class="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2" />
            </label>

            <fieldset v-if="workshop.allowCard && workshop.allowCash">
              <legend class="text-sm font-medium mb-2">{{ t("payment") }}</legend>
              <label class="mb-2 flex items-center gap-2 text-sm">
                <input v-model="form.paymentMethod" type="radio" value="CARD" />
                {{ t("card") }}
              </label>
              <label class="flex items-center gap-2 text-sm">
                <input v-model="form.paymentMethod" type="radio" value="CASH" />
                {{ t("cash") }}
              </label>
            </fieldset>
            <p v-else class="text-sm text-gray-600">
              {{ workshop.allowCard ? t("cardOnly") : t("cashOnly") }}
            </p>
            <p v-if="errorMessage" class="text-sm text-red-700">{{ errorMessage }}</p>
            <Button type="submit" :label="t('submit')" :loading="submitting" class="w-full" />
          </form>
          <p v-else class="text-sm text-gray-600">{{ closedMessage }}</p>
        </aside>
      </div>
      <p v-else class="py-16 text-center h-color-lunar-green">{{ t("notFound") }}</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import Button from "primevue/button";
import { apiRequest } from "~/utils/api-request";
import type { PublicWorkshop, WorkshopPaymentMethod } from "~/types/workshop";

defineI18nRoute({
  paths: {
    ro: "/ateliere/[slug]",
    en: "/workshops/[slug]",
  },
});

const route = useRoute();
const localePath = useLocalePath();
const { t, locale } = useI18n({ useScope: "local" });
const { user, isAuthenticated } = useAuth();
const { book } = useWorkshops();

const slug = computed(() => String(route.params.slug || ""));
const { data, pending } = await useAsyncData(
  () => `workshop-${slug.value}`,
  async () => {
    const response = await apiRequest(`/workshops/${slug.value}`);
    if (!response.ok) {
      return { notFound: true as const };
    }
    return (await response.json()) as PublicWorkshop;
  },
);

const workshop = computed(() =>
  data.value && "notFound" in data.value ? null : data.value,
);

useSeoMeta({
  title: () => workshop.value?.title || t("notFound"),
  description: () => workshop.value?.description.slice(0, 160) || t("notFound"),
});

useHead({
  script: computed(() => {
    const value = workshop.value;
    if (!value) return [];
    return [
      {
        type: "application/ld+json",
        innerHTML: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "Event",
          name: value.title,
          description: value.description,
          startDate: value.startsAt,
          endDate: value.endsAt || undefined,
          eventAttendanceMode: "https://schema.org/OfflineEventAttendanceMode",
          location: {
            "@type": "Place",
            name: value.location,
            address: value.location,
          },
          offers: {
            "@type": "Offer",
            price: value.fee,
            priceCurrency: "RON",
            availability:
              value.spotsLeft > 0
                ? "https://schema.org/InStock"
                : "https://schema.org/SoldOut",
          },
        }),
      },
    ];
  }),
});

const form = reactive({
  firstName: "",
  lastName: "",
  email: "",
  phone: "",
  spots: 1,
  paymentMethod: "CARD" as WorkshopPaymentMethod,
});
const submitting = ref(false);
const errorMessage = ref("");

watch(
  workshop,
  (value) => {
    if (!value) return;
    form.paymentMethod = value.allowCard ? "CARD" : "CASH";
  },
  { immediate: true },
);

onMounted(() => {
  if (!isAuthenticated.value) return;
  form.firstName = user.value.first_name || "";
  form.lastName = user.value.last_name || "";
  form.email = user.value.email || "";
  form.phone = user.value.phone || "";
});

const maxSpots = computed(() => Math.min(20, workshop.value?.spotsLeft || 1));
const canBook = computed(() => {
  if (!workshop.value || workshop.value.spotsLeft < 1) return false;
  return new Date(workshop.value.startsAt).getTime() > Date.now();
});
const closedMessage = computed(() =>
  workshop.value && workshop.value.spotsLeft < 1 ? t("full") : t("closed"),
);

function formatWhen(value: string) {
  return new Intl.DateTimeFormat(locale.value === "en" ? "en-GB" : "ro-RO", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function formatFee(fee: number) {
  return `${Number(fee).toFixed(2)} ${t("currency")}`;
}

async function submit() {
  if (!workshop.value) return;
  errorMessage.value = "";
  submitting.value = true;
  try {
    const origin = window.location.origin;
    const result = await book(workshop.value.slug, {
      ...form,
      spots: Number(form.spots),
      successUrl: `${origin}${localePath("/ateliere/confirmare")}`,
      cancelUrl: window.location.href,
    });
    if (result.url) {
      window.location.href = result.url;
      return;
    }
    await navigateTo(localePath(`/ateliere/confirmare?code=${result.code}`));
  } catch (error) {
    errorMessage.value = error instanceof Error ? error.message : t("error");
  } finally {
    submitting.value = false;
  }
}
</script>

<i18n lang="json">
{
  "ro": {
    "back": "Toate atelierele",
    "perPerson": "pe persoană",
    "spotsLeft": "{count} locuri libere",
    "firstName": "Prenume",
    "lastName": "Nume",
    "email": "Email",
    "phone": "Telefon",
    "spots": "Locuri",
    "payment": "Cum vrei să plătești",
    "card": "Card online",
    "cash": "Numerar la locație",
    "cardOnly": "Rezervarea se face doar prin plata cu cardul.",
    "cashOnly": "Rezervarea se face doar cu numerar, plătit la locație.",
    "submit": "Rezervă locul",
    "full": "Nu mai sunt locuri.",
    "closed": "Înscrierile pentru acest atelier s-au închis.",
    "notFound": "Atelierul nu a fost găsit.",
    "currency": "lei",
    "error": "Rezervarea nu a putut fi făcută."
  },
  "en": {
    "back": "All workshops",
    "perPerson": "per person",
    "spotsLeft": "{count} seats left",
    "firstName": "First name",
    "lastName": "Last name",
    "email": "Email",
    "phone": "Phone",
    "spots": "Seats",
    "payment": "How do you want to pay",
    "card": "Card online",
    "cash": "Cash at the venue",
    "cardOnly": "This reservation can only be paid by card.",
    "cashOnly": "This reservation can only be paid in cash at the venue.",
    "submit": "Reserve a seat",
    "full": "There are no seats left.",
    "closed": "Registration for this workshop is closed.",
    "notFound": "Workshop not found.",
    "currency": "lei",
    "error": "The reservation could not be completed."
  }
}
</i18n>
