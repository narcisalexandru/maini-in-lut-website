<template>
  <div>
    <div class="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
      <div>
        <h1 class="text-2xl font-bold h-color-lunar-green">{{ t("title") }}</h1>
        <p class="text-sm text-gray-600">{{ t("subtitle") }}</p>
      </div>
      <NuxtLink :to="localePath('/admin/ateliere/nou')">
        <Button :label="t('add')" icon="ph ph-plus" />
      </NuxtLink>
    </div>
    <div v-if="loading" class="py-10 text-center">
      <i class="ph ph-spinner animate-spin text-3xl"></i>
    </div>
    <p v-else-if="!workshops.length" class="h-color-lunar-green">{{ t("empty") }}</p>
    <div v-else class="overflow-x-auto rounded-xl bg-white shadow">
      <table class="min-w-full text-left text-sm">
        <thead class="border-b text-gray-500">
          <tr>
            <th class="px-4 py-3">{{ t("name") }}</th>
            <th v-if="isSuperAdmin" class="px-4 py-3">{{ t("artist") }}</th>
            <th class="px-4 py-3">{{ t("when") }}</th>
            <th class="px-4 py-3">{{ t("fee") }}</th>
            <th class="px-4 py-3">{{ t("spots") }}</th>
            <th class="px-4 py-3">{{ t("payment") }}</th>
            <th class="px-4 py-3">{{ t("state") }}</th>
            <th class="px-4 py-3">{{ t("actions") }}</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="workshop in workshops" :key="workshop.id" class="border-b last:border-0">
            <td class="px-4 py-3">
              <NuxtLink :to="localePath(`/admin/ateliere/${workshop.id}`)" class="font-medium h-color-lunar-green">
                {{ workshop.title }}
              </NuxtLink>
            </td>
            <td v-if="isSuperAdmin" class="px-4 py-3">{{ workshop.artist.displayName }}</td>
            <td class="px-4 py-3">{{ formatWhen(workshop.startsAt) }}</td>
            <td class="px-4 py-3">{{ Number(workshop.fee).toFixed(2) }}</td>
            <td class="px-4 py-3">{{ occupancy(workshop) }}</td>
            <td class="px-4 py-3">{{ paymentLabel(workshop) }}</td>
            <td class="px-4 py-3">{{ workshop.published ? t("published") : t("draft") }}</td>
            <td class="px-4 py-3">
              <Button
                size="small"
                severity="secondary"
                :label="t('reserve')"
                :disabled="workshop.spotsLeft < 1"
                @click="openReserve(workshop)"
              />
            </td>
          </tr>
        </tbody>
      </table>
    </div>
    <WorkshopReserveDialog
      v-model:visible="reserveOpen"
      :spots-left="reserveTarget?.spotsLeft ?? 0"
      :loading="reserving"
      :error="reserveError"
      @confirm="confirmReserve"
    />
  </div>
</template>

<script setup lang="ts">
import Button from "primevue/button";
import WorkshopReserveDialog from "~/components/admin/WorkshopReserveDialog.vue";
import type { AdminWorkshop } from "~/types/workshop";

definePageMeta({
  layout: "admin",
  middleware: ["auth", "admin"],
});

const { t, locale } = useI18n({ useScope: "local" });
const localePath = useLocalePath();
const { isSuperAdmin } = useAuth();
const { listAdmin, reserveSeats } = useWorkshops();
const workshops = ref<AdminWorkshop[]>([]);
const loading = ref(true);
const reserveOpen = ref(false);
const reserveTarget = ref<AdminWorkshop | null>(null);
const reserving = ref(false);
const reserveError = ref("");

onMounted(async () => {
  try {
    workshops.value = await listAdmin();
  } finally {
    loading.value = false;
  }
});

function formatWhen(value: string) {
  return new Intl.DateTimeFormat(locale.value === "en" ? "en-GB" : "ro-RO", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function occupancy(workshop: AdminWorkshop) {
  const taken = Math.max(0, workshop.capacity - workshop.spotsLeft);
  return `${taken}/${workshop.capacity}`;
}

function openReserve(workshop: AdminWorkshop) {
  reserveTarget.value = workshop;
  reserveError.value = "";
  reserveOpen.value = true;
}

async function confirmReserve(spots: number) {
  const workshop = reserveTarget.value;
  if (!workshop || reserving.value) {
    return;
  }
  reserving.value = true;
  reserveError.value = "";
  try {
    await reserveSeats(workshop.id, spots);
    workshops.value = await listAdmin();
    reserveOpen.value = false;
    reserveTarget.value = null;
  } catch (error) {
    reserveError.value = error instanceof Error ? error.message : t("reserveError");
  } finally {
    reserving.value = false;
  }
}

function paymentLabel(workshop: AdminWorkshop) {
  if (workshop.allowCard && workshop.allowCash) return t("both");
  if (workshop.allowCard) return t("card");
  return t("cash");
}
</script>

<i18n lang="json">
{
  "ro": {
    "title": "Ateliere",
    "subtitle": "Fiecare atelier aparține unui artist. Artistul își vede și își editează doar atelierele lui.",
    "add": "Adaugă atelier",
    "empty": "Nu ai ateliere încă.",
    "name": "Titlu",
    "artist": "Artist",
    "when": "Data",
    "fee": "Taxă",
    "spots": "Locuri",
    "actions": "Acțiuni",
    "reserve": "Rezervă",
    "reserveError": "Locurile nu au putut fi rezervate.",
    "payment": "Plată",
    "state": "Stare",
    "published": "Publicat",
    "draft": "Ciornă",
    "both": "Card și numerar",
    "card": "Doar card",
    "cash": "Doar numerar"
  },
  "en": {
    "title": "Workshops",
    "subtitle": "Each workshop belongs to one artist. An artist can see and edit only their own workshops.",
    "add": "Add workshop",
    "empty": "You have no workshops yet.",
    "name": "Title",
    "artist": "Artist",
    "when": "Date",
    "fee": "Fee",
    "spots": "Seats",
    "actions": "Actions",
    "reserve": "Reserve",
    "reserveError": "The seats could not be reserved.",
    "payment": "Payment",
    "state": "Status",
    "published": "Published",
    "draft": "Draft",
    "both": "Card and cash",
    "card": "Card only",
    "cash": "Cash only"
  }
}
</i18n>
