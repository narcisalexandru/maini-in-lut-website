<template>
  <div class="product-care-labels">
    <div class="flex flex-wrap gap-3">
      <div
        class="product-care-labels__badge"
        :class="
          product.dishwasherSafe
            ? 'product-care-labels__badge--safe'
            : 'product-care-labels__badge--off'
        "
      >
        <i class="ph ph-washing-machine text-xl"></i>
        <span class="product-care-labels__badge-text">{{ t("dishwasherLabel") }}</span>
      </div>

      <div
        class="product-care-labels__badge"
        :class="
          product.microwaveSafe
            ? 'product-care-labels__badge--safe'
            : 'product-care-labels__badge--off'
        "
      >
        <MicrowaveIcon />
        <span class="product-care-labels__badge-text">{{ t("microwaveLabel") }}</span>
      </div>
    </div>

    <p
      v-if="careMessage"
      class="product-care-labels__message"
      :class="{
        'product-care-labels__message--safe': hasAnyCareOption,
        'product-care-labels__message--warn': !hasAnyCareOption,
      }"
      role="status"
    >
      {{ careMessage }}
    </p>
  </div>
</template>

<script setup>
import MicrowaveIcon from "~/components/icons/MicrowaveIcon.vue";

const props = defineProps({
  product: {
    type: Object,
    required: true,
  },
});

const { t } = useI18n({ useScope: "local" });

const hasAnyCareOption = computed(
  () => props.product.dishwasherSafe || props.product.microwaveSafe,
);

const careMessage = computed(() => {
  const { dishwasherSafe, microwaveSafe } = props.product;

  if (dishwasherSafe && microwaveSafe) {
    return t("bothCareMessage");
  }
  if (dishwasherSafe) {
    return t("dishwasherTip");
  }
  if (microwaveSafe) {
    return t("microwaveTip");
  }
  return t("handWashFallback");
});
</script>

<style scoped lang="scss">
@use "~/assets/scss/_variables.scss" as *;

.product-care-labels__badge {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 0.75rem;
  border-radius: 0.5rem;
  border: 1px solid #e5e7eb;
  font-size: 0.8125rem;
  font-weight: 500;
  transition: border-color 0.15s, background-color 0.15s, color 0.15s;
}

.product-care-labels__badge--safe {
  border-color: $color-primary;
  background-color: #eef2e6;
  color: $palm-leaf;
}

.product-care-labels__badge--off {
  background-color: #f9fafb;
  color: #9ca3af;
  border-color: #e5e7eb;
  text-decoration: line-through;

  .ph,
  :deep(.microwave-icon) {
    opacity: 0.55;
  }
}

.product-care-labels__badge-text {
  line-height: 1.2;
}

.product-care-labels__message {
  margin: 0.75rem 0 0;
  padding: 0.625rem 0.75rem;
  border-radius: 0.5rem;
  font-size: 0.875rem;
  line-height: 1.5;
}

.product-care-labels__message--safe {
  background-color: #eef2e6;
  color: $lunar-green;
}

.product-care-labels__message--warn {
  background-color: #f9fafb;
  color: $lunar-green;
  border: 1px solid #e5e7eb;
}
</style>

<i18n lang="json">
{
  "ro": {
    "dishwasherLabel": "Mașină de spălat vase",
    "microwaveLabel": "Cuptor cu microunde",
    "dishwasherTip": "Poate fi spălat la mașina de spălat vase.",
    "microwaveTip": "Poate fi folosit la cuptorul cu microunde.",
    "bothCareMessage": "Poate fi spălat la mașina de spălat vase și poate fi folosit la cuptorul cu microunde.",
    "handWashFallback": "Recomandăm spălarea manuală. Nu utilizați mașina de spălat vase sau cuptorul cu microunde."
  },
  "en": {
    "dishwasherLabel": "Dishwasher",
    "microwaveLabel": "Microwave",
    "dishwasherTip": "Can be washed in the dishwasher.",
    "microwaveTip": "Can be used in the microwave.",
    "bothCareMessage": "Can be washed in the dishwasher and used in the microwave.",
    "handWashFallback": "Hand washing is recommended. Do not use the dishwasher or microwave."
  }
}
</i18n>
