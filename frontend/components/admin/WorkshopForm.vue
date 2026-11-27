<template>
  <form class="h-bg-white max-w-2xl space-y-4 rounded-xl p-6 shadow" @submit.prevent="save">
    <div v-if="isSuperAdmin">
      <label class="mb-1 block text-sm font-medium" for="artist">{{ t("artist") }}</label>
      <Select
        v-if="!currentWorkshopId"
        id="artist"
        v-model="form.artistId"
        :options="artistOptions"
        option-label="label"
        option-value="value"
        :placeholder="t('artistPlaceholder')"
        class="w-full"
      />
      <p v-else class="text-sm text-gray-700">{{ artistName }}</p>
    </div>
    <label class="block text-sm font-medium" for="title">
      {{ t("title") }}
      <input id="title" v-model="form.title" required minlength="3" maxlength="160" class="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2" />
    </label>
    <label class="block text-sm font-medium" for="description">
      {{ t("description") }}
      <textarea id="description" v-model="form.description" required minlength="10" maxlength="5000" rows="6" class="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2" />
    </label>
    <div class="grid gap-4 md:grid-cols-2">
      <label class="block text-sm font-medium" for="fee">
        {{ t("fee") }}
        <input id="fee" v-model.number="form.fee" type="number" min="0" max="100000" step="0.01" required class="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2" />
      </label>
      <label class="block text-sm font-medium" for="capacity">
        {{ t("capacity") }}
        <input id="capacity" v-model.number="form.capacity" type="number" min="1" max="500" step="1" required class="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2" />
      </label>
    </div>
    <div class="grid gap-4 md:grid-cols-2">
      <label class="block text-sm font-medium" for="startsAt">
        {{ t("startsAt") }}
        <input id="startsAt" v-model="startsLocal" type="datetime-local" required class="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2" />
      </label>
      <label class="block text-sm font-medium" for="endsAt">
        {{ t("endsAt") }}
        <input id="endsAt" v-model="endsLocal" type="datetime-local" class="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2" />
      </label>
    </div>
    <label class="block text-sm font-medium" for="location">
      {{ t("location") }}
      <input id="location" v-model="form.location" required minlength="2" maxlength="200" class="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2" />
    </label>
    <fieldset>
      <legend class="mb-2 text-sm font-medium">{{ t("payments") }}</legend>
      <label class="mb-2 flex items-center gap-2 text-sm">
        <Checkbox v-model="form.allowCard" binary input-id="allowCard" />
        {{ t("card") }}
      </label>
      <label class="flex items-center gap-2 text-sm">
        <Checkbox v-model="form.allowCash" binary input-id="allowCash" />
        {{ t("cash") }}
      </label>
      <p class="mt-2 text-sm text-gray-600">{{ t("paymentsHint") }}</p>
    </fieldset>
    <label class="flex items-center gap-2 text-sm font-medium">
      <Checkbox v-model="form.published" binary input-id="published" />
      {{ t("published") }}
    </label>
    <div class="flex gap-3">
      <Button type="submit" :label="t('save')" :loading="saving" />
      <Button
        v-if="currentWorkshopId"
        type="button"
        severity="danger"
        outlined
        :label="t('remove')"
        @click="deleteDialogVisible = true"
      />
    </div>
    <Dialog
      v-model:visible="deleteDialogVisible"
      modal
      :header="t('deleteTitle')"
      :style="{ width: '480px' }"
    >
      <p class="m-0 text-sm h-color-lunar-green">
        {{ t("removeConfirm", { title: form.title }) }}
      </p>
      <template #footer>
        <Button
          type="button"
          severity="secondary"
          :label="t('cancel')"
          :disabled="removing"
          @click="deleteDialogVisible = false"
        />
        <Button
          type="button"
          severity="danger"
          :label="t('deleteConfirmAction')"
          :loading="removing"
          @click="removeWorkshop"
        />
      </template>
    </Dialog>
  </form>
</template>

<script setup lang="ts">
import Button from "primevue/button";
import Checkbox from "primevue/checkbox";
import Dialog from "primevue/dialog";
import Select from "primevue/select";
import { useToast } from "primevue/usetoast";
import type { WorkshopFormPayload } from "~/types/workshop";

const props = defineProps<{
  workshopId?: number;
}>();

const { t } = useI18n({ useScope: "local" });
const toast = useToast();
const localePath = useLocalePath();
const { isSuperAdmin } = useAuth();
const { listArtists } = useArtist();
const { create, update, getAdmin, remove } = useWorkshops();

const form = reactive({
  title: "",
  description: "",
  fee: 0,
  allowCard: true,
  allowCash: false,
  location: "",
  capacity: 8,
  published: false,
  artistId: undefined as number | undefined,
});
const startsLocal = ref("");
const endsLocal = ref("");
const artistName = ref("");
const artistOptions = ref<{ label: string; value: number }[]>([]);
const saving = ref(false);
const removing = ref(false);
const deleteDialogVisible = ref(false);
const savedWorkshopId = ref<number | null>(props.workshopId ?? null);
const currentWorkshopId = computed(() => props.workshopId ?? savedWorkshopId.value);

onMounted(async () => {
  if (isSuperAdmin.value && !props.workshopId) {
    const artists = await listArtists("APPROVED");
    artistOptions.value = artists.map((artist) => ({
      label: artist.displayName,
      value: artist.id,
    }));
  }
  if (!props.workshopId) return;
  const workshop = await getAdmin(props.workshopId);
  form.title = workshop.title;
  form.description = workshop.description;
  form.fee = Number(workshop.fee);
  form.allowCard = workshop.allowCard;
  form.allowCash = workshop.allowCash;
  form.location = workshop.location;
  form.capacity = workshop.capacity;
  form.published = workshop.published;
  form.artistId = workshop.artistId;
  artistName.value = workshop.artist.displayName;
  startsLocal.value = toLocalInput(workshop.startsAt);
  endsLocal.value = workshop.endsAt ? toLocalInput(workshop.endsAt) : "";
});

function toLocalInput(value: string) {
  const date = new Date(value);
  const pad = (part: number) => String(part).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

async function save() {
  if (!form.allowCard && !form.allowCash) {
    toast.add({ severity: "warn", summary: t("paymentRequired"), life: 4000 });
    return;
  }
  if (isSuperAdmin.value && !currentWorkshopId.value && !form.artistId) {
    toast.add({ severity: "warn", summary: t("artistRequired"), life: 4000 });
    return;
  }
  const payload: WorkshopFormPayload = {
    title: form.title.trim(),
    description: form.description.trim(),
    fee: Number(form.fee),
    allowCard: form.allowCard,
    allowCash: form.allowCash,
    startsAt: new Date(startsLocal.value).toISOString(),
    endsAt: endsLocal.value ? new Date(endsLocal.value).toISOString() : null,
    location: form.location.trim(),
    capacity: Number(form.capacity),
    published: form.published,
  };
  if (isSuperAdmin.value && !currentWorkshopId.value && form.artistId) {
    payload.artistId = form.artistId;
  }
  saving.value = true;
  try {
    await (currentWorkshopId.value
      ? update(currentWorkshopId.value, payload)
      : create(payload));
    toast.add({ severity: "success", summary: t("saved"), life: 3000 });
    await navigateTo(localePath("/admin/ateliere"));
  } catch (error) {
    toast.add({
      severity: "error",
      summary: t("error"),
      detail: error instanceof Error ? error.message : "",
      life: 4000,
    });
  } finally {
    saving.value = false;
  }
}

async function removeWorkshop() {
  if (!currentWorkshopId.value || removing.value) return;
  removing.value = true;
  try {
    await remove(currentWorkshopId.value);
    deleteDialogVisible.value = false;
    await navigateTo(localePath("/admin/ateliere"));
  } catch (error) {
    toast.add({
      severity: "error",
      summary: t("error"),
      detail: error instanceof Error ? error.message : "",
      life: 4000,
    });
  } finally {
    removing.value = false;
  }
}
</script>

<i18n lang="json">
{
  "ro": {
    "artist": "Artist",
    "artistPlaceholder": "Alege artistul",
    "title": "Titlu",
    "description": "Ce se întâmplă la atelier",
    "fee": "Taxă de participare (lei)",
    "capacity": "Număr de locuri",
    "startsAt": "Începe la",
    "endsAt": "Se termină la (opțional)",
    "location": "Locație",
    "payments": "Metode de plată pentru clienți",
    "card": "Card online",
    "cash": "Numerar la locație",
    "paymentsHint": "Poți lăsa ambele, sau doar una. Clienții văd exclusiv metodele bifate.",
    "published": "Publică pe pagina de ateliere",
    "save": "Salvează",
    "saved": "Atelierul a fost salvat",
    "remove": "Anulează atelierul",
    "deleteTitle": "Anulezi atelierul?",
    "removeConfirm": "Atelierul „{title}” va fi anulat și scos de pe site. Persoanele înscrise primesc email. Cine a plătit cu cardul este anunțat că rambursarea se face în 14 zile.",
    "cancel": "Renunță",
    "deleteConfirmAction": "Da, anulează",
    "paymentRequired": "Alege cel puțin o metodă de plată.",
    "artistRequired": "Alege artistul care ține atelierul.",
    "error": "Eroare"
  },
  "en": {
    "artist": "Artist",
    "artistPlaceholder": "Choose the artist",
    "title": "Title",
    "description": "What happens at the workshop",
    "fee": "Participation fee (lei)",
    "capacity": "Number of seats",
    "startsAt": "Starts at",
    "endsAt": "Ends at (optional)",
    "location": "Location",
    "payments": "Payment methods for customers",
    "card": "Card online",
    "cash": "Cash at the venue",
    "paymentsHint": "You can keep both, or only one. Customers only see the methods you check.",
    "published": "Publish on the workshops page",
    "save": "Save",
    "saved": "Workshop saved",
    "remove": "Cancel workshop",
    "deleteTitle": "Cancel this workshop?",
    "removeConfirm": "“{title}” will be cancelled and removed from the site. Everyone with a reservation receives an email. Card payments are told the refund arrives within 14 days.",
    "cancel": "Back",
    "deleteConfirmAction": "Yes, cancel",
    "paymentRequired": "Choose at least one payment method.",
    "artistRequired": "Choose the artist who hosts the workshop.",
    "error": "Error"
  }
}
</i18n>
