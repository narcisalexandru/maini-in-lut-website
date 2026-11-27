<template>
  <Dialog
    :visible="visible"
    modal
    :header="editing ? t('editTitle') : t('title')"
    :style="{ width: '420px' }"
    @update:visible="emit('update:visible', $event)"
  >
    <p class="mb-4 text-sm text-gray-600">
      {{ editing ? t("editHint", { count: spotsLeft }) : t("hint", { count: spotsLeft }) }}
    </p>
    <label class="block text-sm font-medium" for="reserve-spots">
      {{ t("spots") }}
      <InputNumber
        id="reserve-spots"
        v-model="spots"
        class="mt-1 w-full"
        :min="editing ? 0 : 1"
        :max="Math.max(editing ? 0 : 1, maxSpots)"
        :disabled="!editing && spotsLeft < 1"
        show-buttons
        input-class="w-full"
      />
    </label>
    <p v-if="error" class="mt-3 text-sm text-red-700">{{ error }}</p>
    <template #footer>
      <Button severity="secondary" :label="t('cancel')" :disabled="loading" @click="close" />
      <Button
        :label="confirmLabel"
        :loading="loading"
        :disabled="!canConfirm"
        @click="submit"
      />
    </template>
  </Dialog>
</template>

<script setup lang="ts">
import Button from "primevue/button";
import Dialog from "primevue/dialog";
import InputNumber from "primevue/inputnumber";

const props = defineProps<{
  visible: boolean;
  spotsLeft: number;
  initialSpots?: number | null;
  loading?: boolean;
  error?: string;
}>();

const emit = defineEmits<{
  "update:visible": [value: boolean];
  confirm: [spots: number];
}>();

const { t } = useI18n({ useScope: "local" });
const spots = ref(1);
const editing = computed(() => props.initialSpots != null);
const maxSpots = computed(() => props.spotsLeft + (props.initialSpots ?? 0));
const confirmLabel = computed(() => {
  if (!editing.value) {
    return t("confirm");
  }
  return spots.value === 0 ? t("release") : t("save");
});
const canConfirm = computed(() => {
  if (spots.value == null || spots.value > maxSpots.value) {
    return false;
  }
  if (editing.value) {
    return spots.value >= 0 && spots.value !== props.initialSpots;
  }
  return props.spotsLeft > 0 && spots.value >= 1;
});

watch(
  () => props.visible,
  (open) => {
    if (open) {
      spots.value = props.initialSpots ?? 1;
    }
  },
);

function submit() {
  if (!canConfirm.value || spots.value == null) {
    return;
  }
  emit("confirm", spots.value);
}

function close() {
  emit("update:visible", false);
}
</script>

<i18n lang="json">
{
  "ro": {
    "title": "Rezervă locuri",
    "editTitle": "Modifică rezervarea",
    "hint": "Locuri libere: {count}. Locurile rezervate aici nu trebuie plătite.",
    "editHint": "Locuri libere în afara acestei rezervări: {count}. Scazi numărul ca să eliberezi locuri. 0 anulează rezervarea.",
    "spots": "Câte locuri",
    "cancel": "Renunță",
    "confirm": "Rezervă",
    "save": "Salvează",
    "release": "Eliberează locurile"
  },
  "en": {
    "title": "Reserve seats",
    "editTitle": "Change reservation",
    "hint": "Seats left: {count}. Seats reserved here do not need to be paid.",
    "editHint": "Seats left outside this reservation: {count}. Lower the number to free seats. 0 cancels the reservation.",
    "spots": "How many seats",
    "cancel": "Cancel",
    "confirm": "Reserve",
    "save": "Save",
    "release": "Release seats"
  }
}
</i18n>
