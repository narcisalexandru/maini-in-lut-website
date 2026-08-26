<template>
  <div
    class="product-stock"
    :class="`product-stock--${status}`"
    role="status"
  >
    <div class="product-stock__content">
      <span class="product-stock__icon" aria-hidden="true">
        <i :class="iconClass"></i>
      </span>
      <div class="product-stock__copy">
        <p class="product-stock__label">{{ label }}</p>
        <p v-if="detail" class="product-stock__detail">{{ detail }}</p>
      </div>
    </div>
    <div
      v-if="showProgress"
      class="product-stock__bar"
      :aria-label="t('stockProgressLabel')"
    >
      <div
        class="product-stock__bar-fill"
        :style="{ width: `${progressPercent}%` }"
      ></div>
    </div>
  </div>
</template>

<script setup>
import {
  getProductStockQuantity,
  getStockDisplayStatus,
  getStockProgressPercent,
} from "~/utils/product-stock";

const props = defineProps({
  product: {
    type: Object,
    required: true,
  },
});

const { t } = useI18n({ useScope: "local" });

const stockQuantity = computed(() => getProductStockQuantity(props.product));

const status = computed(() => getStockDisplayStatus(props.product));

const progressPercent = computed(() =>
  getStockProgressPercent(stockQuantity.value),
);

const showProgress = computed(
  () => status.value === "limited" || status.value === "last_product",
);

const iconClass = computed(() => {
  switch (status.value) {
    case "out_of_stock":
      return "ph ph-x-circle";
    case "last_product":
      return "ph ph-warning";
    case "limited":
      return "ph ph-hourglass";
    default:
      return "ph ph-check-circle";
  }
});

const label = computed(() => {
  switch (status.value) {
    case "out_of_stock":
      return t("outOfStock");
    case "last_product":
      return t("lastProduct");
    case "limited":
      return t("limitedStock");
    default:
      return t("inStock");
  }
});

const detail = computed(() => {
  switch (status.value) {
    case "last_product":
      return t("lastProductDetail");
    case "limited":
      return t("limitedStockDetail");
    case "in_stock":
      return t("inStockDetail");
    default:
      return "";
  }
});
</script>

<style scoped lang="scss">
@use "~/assets/scss/_variables.scss" as *;

.product-stock {
  margin-bottom: 1.25rem;
  border-radius: 10px;
  padding: 0.875rem 1rem;

  &__content {
    display: flex;
    align-items: flex-start;
    gap: 0.75rem;
  }

  &__icon {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 1.75rem;
    height: 1.75rem;
    border-radius: 999px;
    flex-shrink: 0;
    font-size: 1rem;
    line-height: 1;
  }

  &__copy {
    min-width: 0;
  }

  &__label {
    margin: 0;
    font-size: 0.875rem;
    font-weight: 600;
    line-height: 1.35;
  }

  &__detail {
    margin: 0.25rem 0 0;
    font-size: 0.8125rem;
    line-height: 1.5;
    font-style: italic;
  }

  &__bar {
    height: 3px;
    margin-top: 0.75rem;
    border-radius: 999px;
    overflow: hidden;
    background-color: rgba(0, 0, 0, 0.06);
  }

  &__bar-fill {
    height: 100%;
    border-radius: 999px;
    background-color: $color-primary;
    transition: width 0.35s ease;
    min-width: 8%;
  }

  &--in_stock {
    background-color: #f3f6ef;
    border: 1px solid rgba($color-primary, 0.25);

    .product-stock__icon {
      color: $color-primary;
      background-color: rgba($color-primary, 0.12);
    }

    .product-stock__label {
      color: #4a5a3d;
    }

    .product-stock__detail {
      color: #6b7280;
    }
  }

  &--limited {
    background-color: #faf7f2;
    border: 1px solid #ebe4dc;

    .product-stock__icon {
      color: #9a7348;
      background-color: #f5ebe0;
    }

    .product-stock__label {
      color: #5c4a38;
    }

    .product-stock__detail {
      color: #7a6a5c;
    }
  }

  &--last_product {
    background-color: #faf6f3;
    border: 1px solid #e8ddd4;

    .product-stock__icon {
      color: #a65d3f;
      background-color: #f8ebe4;
    }

    .product-stock__label {
      color: #5c4032;
    }

    .product-stock__detail {
      color: #7a6358;
    }
  }

  &--out_of_stock {
    background-color: #fef2f2;
    border: 1px solid #fecaca;

    .product-stock__icon {
      color: #dc2626;
      background-color: #fee2e2;
    }

    .product-stock__label {
      color: #991b1b;
    }
  }
}
</style>

<i18n lang="json">
{
  "en": {
    "inStock": "In stock",
    "inStockDetail": "This piece is available to order.",
    "limitedStock": "Limited stock",
    "limitedStockDetail": "Reduced stock from this handmade batch.",
    "lastProduct": "Last item available",
    "lastProductDetail": "Only 1 unit left from this handmade batch.",
    "outOfStock": "Out of stock",
    "stockProgressLabel": "Remaining stock level"
  },
  "ro": {
    "inStock": "În stoc",
    "inStockDetail": "Piesa este disponibilă pentru comandă.",
    "limitedStock": "Stoc limitat",
    "limitedStockDetail": "Stoc redus din acest lot lucrat manual.",
    "lastProduct": "Ultimul produs disponibil",
    "lastProductDetail": "Doar 1 unitate rămasă din acest lot lucrat manual.",
    "outOfStock": "Stoc epuizat",
    "stockProgressLabel": "Nivel stoc rămas"
  }
}
</i18n>
