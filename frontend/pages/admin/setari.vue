<template>
  <div>
    <h1 class="text-2xl font-bold h-color-lunar-green mb-2">{{ t("title") }}</h1>
    <p class="h-color-lunar-green mb-6">{{ t("subtitle") }}</p>

    <form
      class="h-bg-white rounded-xl shadow p-6 max-w-xl space-y-4"
      @submit.prevent="save"
    >
      <div>
        <label class="block text-sm font-medium mb-1" for="easyboxFee">{{ t("easyboxFee") }}</label>
        <input
          id="easyboxFee"
          v-model.number="form.easyboxFeeRon"
          type="number"
          min="0"
          max="10000"
          step="0.01"
          required
          class="w-full rounded-lg border border-gray-300 px-3 py-2"
        />
      </div>
      <div>
        <label class="block text-sm font-medium mb-1" for="addressFee">{{ t("addressFee") }}</label>
        <input
          id="addressFee"
          v-model.number="form.addressFeeRon"
          type="number"
          min="0"
          max="10000"
          step="0.01"
          required
          class="w-full rounded-lg border border-gray-300 px-3 py-2"
        />
      </div>
      <div class="grid grid-cols-2 gap-4">
        <div>
          <label class="block text-sm font-medium mb-1" for="daysMin">{{ t("daysMin") }}</label>
          <input
            id="daysMin"
            v-model.number="form.deliveryDaysMin"
            type="number"
            min="1"
            max="60"
            step="1"
            required
            class="w-full rounded-lg border border-gray-300 px-3 py-2"
          />
        </div>
        <div>
          <label class="block text-sm font-medium mb-1" for="daysMax">{{ t("daysMax") }}</label>
          <input
            id="daysMax"
            v-model.number="form.deliveryDaysMax"
            type="number"
            min="1"
            max="60"
            step="1"
            required
            class="w-full rounded-lg border border-gray-300 px-3 py-2"
          />
        </div>
      </div>
      <p class="text-sm text-gray-600">{{ preview }}</p>
      <Button type="submit" :label="t('save')" :loading="saving" />
    </form>
  </div>
</template>

<script setup>
import Button from "primevue/button";
import { useToast } from "primevue/usetoast";
import { DEFAULT_SITE_SETTINGS } from "~/composables/useSiteSettings";

definePageMeta({
  layout: "admin",
  middleware: ["auth", "super-admin"],
});

const { t } = useI18n({ useScope: "local" });
const toast = useToast();
const { getAdminSettings, updateAdminSettings } = useSiteSettings();

const form = ref({ ...DEFAULT_SITE_SETTINGS });
const saving = ref(false);

const preview = computed(() =>
  t("preview", {
    easybox: form.value.easyboxFeeRon,
    address: form.value.addressFeeRon,
    min: form.value.deliveryDaysMin,
    max: form.value.deliveryDaysMax,
  }),
);

const save = async () => {
  if (form.value.deliveryDaysMin > form.value.deliveryDaysMax) {
    toast.add({ severity: "warn", summary: t("daysOrder"), life: 4000 });
    return;
  }
  saving.value = true;
  try {
    form.value = await updateAdminSettings(form.value);
    toast.add({ severity: "success", summary: t("saved"), life: 3000 });
  } catch (error) {
    toast.add({
      severity: "error",
      summary: t("error"),
      detail: error.message,
      life: 4000,
    });
  } finally {
    saving.value = false;
  }
};

onMounted(async () => {
  try {
    form.value = await getAdminSettings();
  } catch (error) {
    toast.add({
      severity: "error",
      summary: t("error"),
      detail: error.message,
      life: 4000,
    });
  }
});
</script>

<i18n lang="json">
{
  "ro": {
    "title": "Setări site",
    "subtitle": "Costurile de livrare și termenul afișat în magazin, coș și termeni.",
    "easyboxFee": "Livrare Easybox (RON)",
    "addressFee": "Livrare la adresă (RON)",
    "daysMin": "Zile minime",
    "daysMax": "Zile maxime",
    "preview": "Clienții văd: Easybox {easybox} RON, adresă {address} RON, livrare în {min}–{max} zile lucrătoare.",
    "save": "Salvează",
    "saved": "Setările au fost salvate",
    "daysOrder": "Termenul minim nu poate fi mai mare decât cel maxim.",
    "error": "Eroare"
  },
  "en": {
    "title": "Site settings",
    "subtitle": "Delivery prices and the time shown in the shop, cart, and terms.",
    "easyboxFee": "Easybox delivery (RON)",
    "addressFee": "Address delivery (RON)",
    "daysMin": "Minimum days",
    "daysMax": "Maximum days",
    "preview": "Customers see: Easybox {easybox} RON, address {address} RON, delivery in {min}–{max} business days.",
    "save": "Save",
    "saved": "Settings saved",
    "daysOrder": "The minimum time cannot be greater than the maximum.",
    "error": "Error"
  }
}
</i18n>
