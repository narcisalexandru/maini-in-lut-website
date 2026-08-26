<template>
  <div v-if="items.length > 0" class="rounded-lg border border-amber-200 bg-amber-50/60 p-3 space-y-2">
    <p class="text-xs font-semibold uppercase tracking-wide text-amber-800 m-0">
      {{ title }}
    </p>
    <div
      v-for="item in items"
      :key="item.key"
      class="rounded-md border border-amber-100 bg-white p-2.5"
    >
      <p class="text-xs font-semibold text-gray-700 m-0 mb-1.5">{{ item.label }}</p>
      <div class="grid grid-cols-1 sm:grid-cols-[1fr_auto_1fr] gap-2 items-start text-sm">
        <div class="rounded bg-red-50 border border-red-100 px-2 py-1.5">
          <span class="block text-[10px] uppercase text-red-500 mb-0.5">{{ beforeLabel }}</span>
          <span class="text-gray-800 break-words">{{ item.oldValue }}</span>
        </div>
        <div class="hidden sm:flex items-center justify-center text-amber-700 pt-4">
          <i class="ph ph-arrow-right"></i>
        </div>
        <div class="rounded bg-green-50 border border-green-100 px-2 py-1.5">
          <span class="block text-[10px] uppercase text-green-600 mb-0.5">{{ afterLabel }}</span>
          <span class="text-gray-900 font-medium break-words">{{ item.newValue }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { AdminProduct } from "~/types/product";
import { getProductChangeItems } from "~/utils/product-changes";

const props = defineProps<{
  product: AdminProduct;
  changes: Partial<AdminProduct> & { images?: string[] };
  title?: string;
  beforeLabel?: string;
  afterLabel?: string;
}>();

const { locale } = useI18n();

const items = computed(() =>
  getProductChangeItems(props.product, props.changes, locale.value),
);
</script>
