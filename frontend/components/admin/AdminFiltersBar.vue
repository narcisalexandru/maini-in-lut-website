<template>
  <div
    class="flex flex-col lg:flex-row flex-wrap gap-3 mb-6 p-4 h-bg-white rounded-xl shadow"
  >
    <div v-if="showSearch" class="flex flex-col gap-1 min-w-[200px] flex-1">
      <label class="text-sm h-color-lunar-green">{{ t("search") }}</label>
      <InputText
        :model-value="search"
        :placeholder="searchPlaceholder || t('searchPlaceholder')"
        @update:model-value="emit('update:search', $event)"
      />
    </div>

    <div v-if="showStatusFilter && statusOptions.length" class="flex flex-col gap-1 min-w-[180px]">
      <label class="text-sm h-color-lunar-green">{{ statusLabel || t("status") }}</label>
      <Select
        :model-value="status"
        :options="statusOptions"
        option-label="label"
        option-value="value"
        show-clear
        :placeholder="t('all')"
        @update:model-value="emit('update:status', $event)"
      />
    </div>

    <div
      v-if="showPaymentFilter && paymentStatusOptions.length"
      class="flex flex-col gap-1 min-w-[180px]"
    >
      <label class="text-sm h-color-lunar-green">{{ t("paymentStatus") }}</label>
      <Select
        :model-value="paymentStatus"
        :options="paymentStatusOptions"
        option-label="label"
        option-value="value"
        show-clear
        :placeholder="t('all')"
        @update:model-value="emit('update:paymentStatus', $event)"
      />
    </div>

    <div
      v-if="showArtistFilter && artistOptions.length"
      class="flex flex-col gap-1 min-w-[200px]"
    >
      <label class="text-sm h-color-lunar-green">{{ t("artist") }}</label>
      <Select
        :model-value="artistId"
        :options="artistOptions"
        option-label="label"
        option-value="value"
        show-clear
        :placeholder="t('all')"
        filter
        @update:model-value="emit('update:artistId', $event)"
      />
    </div>

    <div v-if="hasActiveFilters" class="flex items-end">
      <Button
        severity="secondary"
        outlined
        :label="t('clear')"
        icon="ph ph-x"
        @click="emit('clear')"
      />
    </div>
  </div>
</template>

<script setup>
import InputText from "primevue/inputtext";
import Select from "primevue/select";
import Button from "primevue/button";

const props = defineProps({
  search: { type: String, default: "" },
  status: { type: String, default: null },
  paymentStatus: { type: String, default: null },
  artistId: { type: Number, default: null },
  statusOptions: { type: Array, default: () => [] },
  paymentStatusOptions: { type: Array, default: () => [] },
  artistOptions: { type: Array, default: () => [] },
  showSearch: { type: Boolean, default: true },
  showArtistFilter: { type: Boolean, default: false },
  showPaymentFilter: { type: Boolean, default: false },
  showStatusFilter: { type: Boolean, default: true },
  searchPlaceholder: { type: String, default: "" },
  statusLabel: { type: String, default: "" },
});

const emit = defineEmits([
  "update:search",
  "update:status",
  "update:paymentStatus",
  "update:artistId",
  "clear",
]);

const { t } = useI18n({ useScope: "local" });

const hasActiveFilters = computed(() =>
  Boolean(
    props.search?.trim() ||
      props.status ||
      props.paymentStatus ||
      props.artistId,
  ),
);
</script>

<i18n lang="json">
{
  "ro": {
    "search": "Căutare",
    "searchPlaceholder": "Caută...",
    "status": "Status",
    "paymentStatus": "Status plată",
    "artist": "Artist",
    "all": "Toate",
    "clear": "Resetează filtre"
  },
  "en": {
    "search": "Search",
    "searchPlaceholder": "Search...",
    "status": "Status",
    "paymentStatus": "Payment status",
    "artist": "Artist",
    "all": "All",
    "clear": "Clear filters"
  }
}
</i18n>
