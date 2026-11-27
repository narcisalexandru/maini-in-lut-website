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
      <div>
        <label class="block text-sm font-medium mb-1" for="announcementRo">{{ t("announcementRo") }}</label>
        <textarea
          id="announcementRo"
          ref="announcementRoInput"
          v-model="form.announcementTextRo"
          maxlength="300"
          rows="3"
          class="w-full rounded-lg border border-gray-300 px-3 py-2"
        />
        <div class="mt-2 flex flex-wrap gap-2">
          <button
            v-for="tag in announcementTags"
            :key="'ro-' + tag.token"
            type="button"
            class="announcement-tag"
            @mousedown.prevent
            @click="insertTag('announcementTextRo', tag.token)"
          >
            {{ tag.token }}
          </button>
        </div>
      </div>
      <div>
        <label class="block text-sm font-medium mb-1" for="announcementEn">{{ t("announcementEn") }}</label>
        <textarea
          id="announcementEn"
          ref="announcementEnInput"
          v-model="form.announcementTextEn"
          maxlength="300"
          rows="3"
          class="w-full rounded-lg border border-gray-300 px-3 py-2"
        />
        <div class="mt-2 flex flex-wrap gap-2">
          <button
            v-for="tag in announcementTags"
            :key="'en-' + tag.token"
            type="button"
            class="announcement-tag"
            @mousedown.prevent
            @click="insertTag('announcementTextEn', tag.token)"
          >
            {{ tag.token }}
          </button>
        </div>
        <p class="mt-2 text-sm text-gray-600">{{ t("placeholders") }}</p>
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

const { t, locale } = useI18n({ useScope: "local" });
const toast = useToast();
const { getAdminSettings, updateAdminSettings } = useSiteSettings();

const form = ref({ ...DEFAULT_SITE_SETTINGS });
const saving = ref(false);
const announcementRoInput = ref(null);
const announcementEnInput = ref(null);
const announcementTags = [
  { token: "{min}" },
  { token: "{max}" },
  { token: "{easybox}" },
  { token: "{address}" },
];

const insertTag = (field, token) => {
  const element =
    field === "announcementTextRo"
      ? announcementRoInput.value
      : announcementEnInput.value;
  const current = form.value[field] || "";
  const focused = element && document.activeElement === element;
  const start = focused ? element.selectionStart : current.length;
  const end = focused ? element.selectionEnd : current.length;
  const next = `${current.slice(0, start)}${token}${current.slice(end)}`;
  if (next.length > 300) {
    return;
  }
  form.value[field] = next;
  nextTick(() => {
    if (!element) return;
    element.focus();
    const caret = start + token.length;
    element.setSelectionRange(caret, caret);
  });
};

const preview = computed(() => {
  const template =
    locale.value === "en"
      ? form.value.announcementTextEn
      : form.value.announcementTextRo;
  return template
    .replaceAll("{min}", String(form.value.deliveryDaysMin))
    .replaceAll("{max}", String(form.value.deliveryDaysMax))
    .replaceAll("{easybox}", String(form.value.easyboxFeeRon))
    .replaceAll("{address}", String(form.value.addressFeeRon));
});

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
    "subtitle": "Costurile de livrare și textul barei de sub navbar.",
    "easyboxFee": "Livrare Easybox (RON)",
    "addressFee": "Livrare la adresă (RON)",
    "daysMin": "Zile minime",
    "daysMax": "Zile maxime",
    "announcementRo": "Text bară (română)",
    "announcementEn": "Text bară (engleză)",
    "placeholders": "Apasă un tag ca să îl pui în text, la cursor. Se înlocuiește cu valoarea de mai sus.",
    "save": "Salvează",
    "saved": "Setările au fost salvate",
    "daysOrder": "Termenul minim nu poate fi mai mare decât cel maxim.",
    "error": "Eroare"
  },
  "en": {
    "title": "Site settings",
    "subtitle": "Delivery prices and the text in the bar under the navigation.",
    "easyboxFee": "Easybox delivery (RON)",
    "addressFee": "Address delivery (RON)",
    "daysMin": "Minimum days",
    "daysMax": "Maximum days",
    "announcementRo": "Bar text (Romanian)",
    "announcementEn": "Bar text (English)",
    "placeholders": "Press a tag to insert it at the cursor. It is replaced with the value above.",
    "save": "Save",
    "saved": "Settings saved",
    "daysOrder": "The minimum time cannot be greater than the maximum.",
    "error": "Error"
  }
}
</i18n>

<style scoped>
.announcement-tag {
  border: 1px solid #6f825d;
  border-radius: 999px;
  background: #f4f7f2;
  color: #3f5134;
  font-size: 0.75rem;
  font-weight: 600;
  line-height: 1;
  padding: 0.4rem 0.7rem;
}

.announcement-tag:hover {
  background: #e7efe2;
}
</style>
