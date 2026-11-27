<template>
  <div>
    <div class="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <h1 class="text-2xl font-bold h-color-lunar-green">{{ t("title") }}</h1>
      <div class="flex items-center gap-3">
        <p v-if="workshop" class="text-sm h-color-lunar-green">
          {{ occupancy(workshop) }}
        </p>
        <Button
          :label="t('reserve')"
          :disabled="!workshop || workshop.spotsLeft < 1"
          @click="openReserve"
        />
      </div>
    </div>
    <WorkshopForm :workshop-id="workshopId" />
    <WorkshopReserveDialog
      v-model:visible="reserveOpen"
      :spots-left="workshop?.spotsLeft ?? 0"
      :initial-spots="editingBooking?.spots ?? null"
      :loading="reserving"
      :error="reserveError"
      @confirm="confirmReserve"
    />
    <section v-if="bookings.length" class="mt-8 overflow-x-auto rounded-xl bg-white shadow">
      <h2 class="px-4 pt-4 text-lg font-semibold h-color-lunar-green">{{ t("bookings") }}</h2>
      <table class="min-w-full text-left text-sm">
        <thead class="border-b text-gray-500">
          <tr>
            <th class="px-4 py-3">{{ t("code") }}</th>
            <th class="px-4 py-3">{{ t("customer") }}</th>
            <th class="px-4 py-3">{{ t("spots") }}</th>
            <th class="px-4 py-3">{{ t("payment") }}</th>
            <th class="px-4 py-3">{{ t("status") }}</th>
            <th class="px-4 py-3">{{ t("actions") }}</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="booking in bookings" :key="booking.id" class="border-b last:border-0">
            <td class="px-4 py-3">{{ booking.code }}</td>
            <td class="px-4 py-3">
              {{ booking.customerName }}<br />
              <span class="text-gray-500">{{ booking.customerEmail }} · {{ booking.customerPhone }}</span>
            </td>
            <td class="px-4 py-3">{{ booking.spots }}</td>
            <td class="px-4 py-3">{{ paymentLabel(booking.paymentMethod) }}</td>
            <td class="px-4 py-3">{{ statusLabel(booking) }}</td>
            <td class="px-4 py-3">
              <Button
                v-if="booking.paymentMethod === 'COMPLIMENTARY'"
                size="small"
                severity="secondary"
                :label="t('editReservation')"
                @click="openEdit(booking)"
              />
            </td>
          </tr>
        </tbody>
      </table>
    </section>
  </div>
</template>

<script setup lang="ts">
import Button from "primevue/button";
import WorkshopForm from "~/components/admin/WorkshopForm.vue";
import WorkshopReserveDialog from "~/components/admin/WorkshopReserveDialog.vue";
import type {
  AdminWorkshopDetail,
  WorkshopBookingRow,
  WorkshopPaymentMethod,
  WorkshopPaymentStatus,
} from "~/types/workshop";

definePageMeta({
  layout: "admin",
  middleware: ["auth", "admin"],
});

const route = useRoute();
const { t } = useI18n({ useScope: "local" });
const { getAdmin, reserveSeats, updateReservation } = useWorkshops();
const workshopId = computed(() => Number(route.params.id));
const workshop = ref<AdminWorkshopDetail | null>(null);
const bookings = ref<WorkshopBookingRow[]>([]);
const reserveOpen = ref(false);
const editingBooking = ref<WorkshopBookingRow | null>(null);
const reserving = ref(false);
const reserveError = ref("");

onMounted(loadWorkshop);

async function loadWorkshop() {
  const loaded = await getAdmin(workshopId.value);
  workshop.value = loaded;
  bookings.value = loaded.bookings;
}

function occupancy(value: AdminWorkshopDetail) {
  const taken = Math.max(0, value.capacity - value.spotsLeft);
  return `${taken}/${value.capacity}`;
}

function openReserve() {
  editingBooking.value = null;
  reserveError.value = "";
  reserveOpen.value = true;
}

function openEdit(booking: WorkshopBookingRow) {
  editingBooking.value = booking;
  reserveError.value = "";
  reserveOpen.value = true;
}

async function confirmReserve(spots: number) {
  if (reserving.value) {
    return;
  }
  reserving.value = true;
  reserveError.value = "";
  try {
    const loaded = editingBooking.value
      ? await updateReservation(workshopId.value, editingBooking.value.id, spots)
      : await reserveSeats(workshopId.value, spots);
    workshop.value = loaded;
    bookings.value = loaded.bookings;
    editingBooking.value = null;
    reserveOpen.value = false;
  } catch (error) {
    reserveError.value = error instanceof Error ? error.message : t("reserveError");
  } finally {
    reserving.value = false;
  }
}

function paymentLabel(method: WorkshopPaymentMethod) {
  if (method === "COMPLIMENTARY") return t("complimentary");
  if (method === "CARD") return t("card");
  return t("cash");
}

function statusLabel(booking: WorkshopBookingRow) {
  if (booking.paymentMethod === "COMPLIMENTARY") return t("reserved");
  return statusText(booking.paymentStatus);
}

function statusText(status: WorkshopPaymentStatus) {
  if (status === "PAID") return t("paid");
  if (status === "AWAITING_CASH") return t("awaitingCash");
  if (status === "FAILED") return t("failed");
  return t("pending");
}
</script>

<i18n lang="json">
{
  "ro": {
    "title": "Editează atelierul",
    "bookings": "Rezervări",
    "code": "Cod",
    "customer": "Client",
    "spots": "Locuri",
    "payment": "Plată",
    "status": "Stare",
    "card": "Card",
    "cash": "Numerar",
    "paid": "Plătit",
    "awaitingCash": "De achitat la locație",
    "failed": "Eșuată",
    "pending": "În așteptare",
    "reserve": "Rezervă locuri",
    "reserveError": "Locurile nu au putut fi rezervate.",
    "complimentary": "Fără plată",
    "reserved": "Rezervat",
    "actions": "Acțiuni",
    "editReservation": "Modifică"
  },
  "en": {
    "title": "Edit workshop",
    "bookings": "Reservations",
    "code": "Code",
    "customer": "Customer",
    "spots": "Seats",
    "payment": "Payment",
    "status": "Status",
    "card": "Card",
    "cash": "Cash",
    "paid": "Paid",
    "awaitingCash": "Pay at the venue",
    "failed": "Failed",
    "pending": "Pending",
    "reserve": "Reserve seats",
    "reserveError": "The seats could not be reserved.",
    "complimentary": "No payment",
    "reserved": "Reserved",
    "actions": "Actions",
    "editReservation": "Change"
  }
}
</i18n>
