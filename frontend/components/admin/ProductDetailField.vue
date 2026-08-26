<template>
  <div :class="{ 'sm:col-span-2': fullWidth }">
    <dt class="text-xs uppercase tracking-wide text-gray-500 m-0">{{ label }}</dt>
    <dd
      class="text-sm text-gray-900 font-medium mt-1 m-0"
      :class="{ 'whitespace-pre-wrap break-words': multiline }"
    >
      {{ displayValue }}
    </dd>
  </div>
</template>

<script setup lang="ts">
const props = defineProps<{
  label: string;
  value?: string | null;
  fullWidth?: boolean;
  multiline?: boolean;
}>();

const { t } = useI18n({ useScope: "local" });

const displayValue = computed(() => {
  const value = props.value?.trim();
  return value ? value : t("empty");
});
</script>

<i18n lang="json">
{
  "ro": { "empty": "—" },
  "en": { "empty": "—" }
}
</i18n>
