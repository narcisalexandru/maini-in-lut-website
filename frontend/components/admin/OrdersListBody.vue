<template>
  <div>
    <div v-if="loading" class="flex justify-center py-12">
      <i class="ph ph-spinner text-3xl animate-spin h-color-primary"></i>
    </div>

    <div v-else class="space-y-4">
      <div
        v-for="order in orders"
        :key="order.id"
        class="h-bg-white rounded-xl shadow p-4 md:p-6"
        :class="{ 'opacity-90': archived }"
      >
        <div class="flex flex-col md:flex-row md:items-center md:justify-between gap-2 mb-4">
          <div>
            <div class="flex items-center gap-2 flex-wrap">
              <span class="font-semibold h-color-lunar-green">
                {{ order.publicOrderNumber }}
              </span>
              <span
                v-if="archived"
                class="inline-flex items-center rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-600"
              >
                {{ t("archivedBadge") }}
              </span>
            </div>
            <div class="text-sm h-color-lunar-green">
              {{ formatDate(order.createdAt) }} · {{ order.totalRon }} RON
            </div>
            <div
              v-if="order.customer?.email"
              class="text-sm h-color-lunar-green"
            >
              <NuxtLink
                v-if="showCustomerLinks && order.userId"
                :to="localePath(`/admin/clienti/${order.userId}/comenzi`)"
                class="text-blue-600 hover:underline"
              >
                {{ order.customer.firstName }} {{ order.customer.lastName }} ·
                {{ order.customer.email }}
              </NuxtLink>
              <template v-else>
                {{ order.customer.firstName }} {{ order.customer.lastName }} ·
                {{ order.customer.email }}
              </template>
            </div>
          </div>
          <div class="flex flex-wrap items-center gap-2">
            <Tag :value="paymentStatusLabel(order.paymentStatus)" severity="info" />
            <Button
              v-if="archived"
              :label="t('unarchive')"
              severity="secondary"
              size="small"
              outlined
              :loading="unarchivingOrderId === order.id"
              @click="emit('unarchive', order.id)"
            />
          </div>
        </div>

        <div
          v-for="item in order.items || []"
          :key="item.id"
          class="flex flex-col md:flex-row md:items-center md:justify-between gap-3 border-t border-gray-100 pt-3 mt-3"
        >
          <div>
            <div class="font-medium">{{ item.title }}</div>
            <div class="text-sm h-color-lunar-green">
              {{ item.artistDisplayName }} · {{ item.quantity }} ×
              {{ item.unitPriceRon }} RON
            </div>
          </div>
          <div class="flex items-center gap-2">
            <Tag :value="itemStatusLabel(item.status)" />
            <Select
              v-if="canUpdateStatus(order)"
              :model-value="item.status"
              :options="statusOptions"
              option-label="label"
              option-value="value"
              class="w-40"
              @update:model-value="(value) => emit('update-status', item.id, value)"
            />
          </div>
        </div>
      </div>

      <p v-if="!orders.length" class="text-center h-color-lunar-green py-8 m-0">
        {{ archived ? t("emptyArchived") : t("emptyActive") }}
      </p>
    </div>
  </div>
</template>

<script setup>
import Tag from "primevue/tag";
import Select from "primevue/select";
import Button from "primevue/button";

defineProps({
  orders: {
    type: Array,
    default: () => [],
  },
  loading: {
    type: Boolean,
    default: false,
  },
  unarchivingOrderId: {
    type: Number,
    default: null,
  },
  statusOptions: {
    type: Array,
    default: () => [],
  },
  itemStatusLabel: {
    type: Function,
    required: true,
  },
  paymentStatusLabel: {
    type: Function,
    required: true,
  },
  formatDate: {
    type: Function,
    required: true,
  },
  canUpdateStatus: {
    type: Function,
    required: true,
  },
  showCustomerLinks: {
    type: Boolean,
    default: false,
  },
  archived: {
    type: Boolean,
    default: false,
  },
});

const emit = defineEmits(["update-status", "unarchive"]);

const { t } = useI18n({ useScope: "local" });
const localePath = useLocalePath();
</script>

<i18n lang="json">
{
  "ro": {
    "archivedBadge": "Arhivată",
    "unarchive": "Scoate din arhivă",
    "emptyActive": "Nicio comandă activă nu corespunde filtrelor.",
    "emptyArchived": "Nicio comandă arhivată nu corespunde filtrelor."
  },
  "en": {
    "archivedBadge": "Archived",
    "unarchive": "Remove from archive",
    "emptyActive": "No active orders match the current filters.",
    "emptyArchived": "No archived orders match the current filters."
  }
}
</i18n>
