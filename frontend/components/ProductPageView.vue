<template>
  <div class="maini-ui__section md:px-4">
    <div class="maini-ui__container-products">
      <nav class="flex mb-6 text-sm h-color-dusty-gray" aria-label="Breadcrumb">
        <ol class="flex flex-wrap items-center gap-1">
          <li>
            <component
              :is="preview ? 'span' : 'NuxtLink'"
              v-bind="preview ? {} : { to: $localePath('/') }"
              :class="preview ? '' : 'hover:h-color-primary'"
            >
              {{ t("breadcrumb.home") }}
            </component>
          </li>
          <li><span class="mx-1">/</span></li>
          <li>
            <component
              :is="preview ? 'span' : 'NuxtLink'"
              v-bind="preview ? {} : { to: $localePath('/produse') }"
              :class="preview ? '' : 'hover:h-color-primary'"
            >
              {{ t("breadcrumb.products") }}
            </component>
          </li>
          <li><span class="mx-1">/</span></li>
          <li>
            <span
              class="font-medium"
              :class="missingTitle ? 'text-amber-600 italic' : 'h-color-lunar-green'"
            >
              {{ displayTitle }}
            </span>
          </li>
        </ol>
      </nav>

      <div v-if="loading" class="flex justify-center py-16">
        <i class="ph ph-spinner text-4xl animate-spin h-color-primary"></i>
      </div>

      <div v-else class="flex flex-col lg:flex-row gap-8 lg:gap-12">
        <div class="flex-1 lg:max-w-[55%]">
          <div
            class="aspect-square bg-white rounded-lg overflow-hidden shadow-sm mb-4"
          >
            <img
              v-if="hasImages"
              :src="selectedImage || productImages[0]"
              :alt="displayTitle"
              class="w-full h-full object-cover"
            />
            <div
              v-else
              class="w-full h-full flex flex-col items-center justify-center gap-3 p-8 text-center bg-gray-50 border-2 border-dashed border-gray-200"
            >
              <i class="ph ph-image text-5xl text-gray-300"></i>
              <p class="text-sm text-amber-600 italic m-0">
                {{ t("missingImages") }}
              </p>
            </div>
          </div>
          <div v-if="hasImages" class="flex gap-2 items-center">
            <button
              v-for="(img, idx) in productImages"
              :key="idx"
              type="button"
              class="w-20 h-20 rounded-lg overflow-hidden border-2 transition-all flex-shrink-0"
              :class="
                selectedImage === img
                  ? 'h-border-color-primary ring-2 ring-[#8a9772]/30'
                  : 'border-transparent hover:border-gray-300'
              "
              @click="selectedImage = img"
            >
              <img
                :src="img"
                :alt="`${displayTitle} ${idx + 1}`"
                class="w-full h-full object-cover"
              />
            </button>
          </div>
        </div>

        <div class="flex-1 lg:max-w-[45%]">
          <div class="flex flex-wrap items-center gap-2 mb-2">
            <h1
              class="text-2xl md:text-3xl font-bold m-0"
              :class="missingTitle ? 'text-amber-600 italic' : 'h-color-lunar-green'"
            >
              {{ displayTitle }}
            </h1>
            <span
              v-if="product.isSet"
              class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold uppercase bg-[#eef2e6] text-[#5c6b4a] border border-[#8a9772]/40"
            >
              {{ t("setBadge") }}
            </span>
          </div>

          <p v-if="product.artist" class="text-sm mb-4 h-color-lunar-green">
            {{ t("soldBy") }}
            <component
              :is="preview ? 'span' : 'NuxtLink'"
              v-bind="
                preview
                  ? {}
                  : { to: $localePath(`/atelier/${product.artist.slug}`) }
              "
              class="h-color-primary font-semibold"
              :class="{ 'hover:underline': !preview }"
            >
              {{ product.artist.displayName }}
            </component>
          </p>

          <p
            v-if="preview && missingCategory"
            class="text-sm text-amber-600 italic mb-4"
          >
            {{ t("missingCategory") }}
          </p>
          <p
            v-else-if="product.category"
            class="text-sm text-gray-500 mb-4"
          >
            {{ t("categoryLabel") }}: {{ product.category }}
          </p>

          <div class="flex items-center gap-2 mb-4">
            <span
              v-if="product.discount > 0"
              class="text-gray-400 line-through text-lg"
            >
              {{ product.priceBeforeDiscount }} RON
            </span>
            <span
              v-if="missingPrice"
              class="text-lg text-amber-600 italic"
            >
              {{ t("missingPrice") }}
            </span>
            <span v-else class="h-font-weight-600 h-color-lunar-green text-xl">
              {{ product.price }} RON
            </span>
          </div>

          <blockquote
            v-if="displayDescription"
            class="product-quote"
            :class="{ 'product-quote--missing': missingDescription }"
          >
            <p>"{{ displayDescription }}"</p>
          </blockquote>

          <ProductStockStatus :product="product" />

          <div class="flex flex-wrap items-center gap-4 mb-6">
            <div
              class="quantity-picker flex items-center border border-gray-300 rounded-lg overflow-hidden"
            >
              <button
                type="button"
                class="w-10 h-10 flex items-center justify-center cursor-pointer transition-colors"
                :class="{ 'opacity-40 cursor-not-allowed': quantity <= 1 }"
                :disabled="quantity <= 1"
                :aria-label="t('decreaseQty')"
                @click="decreaseQuantity"
              >
                <i class="ph ph-minus text-sm h-color-primary"></i>
              </button>
              <input
                v-model.number="quantity"
                type="number"
                min="1"
                :max="maxAddableQuantity"
                class="quantity-input w-10 h-8 text-center h-color-palm-leaf border-none focus:outline-none focus:ring-0 focus:border-none"
                @change="onQuantityChange"
              />
              <button
                type="button"
                class="w-10 h-10 flex items-center justify-center cursor-pointer transition-colors"
                :class="{
                  'opacity-40 cursor-not-allowed':
                    !canIncreaseQuantity || maxAddableQuantity <= 0,
                }"
                :disabled="!canIncreaseQuantity || maxAddableQuantity <= 0"
                :aria-label="t('increaseQty')"
                @click="increaseQuantity"
              >
                <i class="ph ph-plus text-sm h-color-primary"></i>
              </button>
            </div>
            <span
              v-if="isAvailable && maxAddableQuantity <= 0"
              class="text-sm text-amber-700"
            >
              {{ t("cartStockLimit") }}
            </span>
          </div>

          <button
            class="maini-ui-button__buy w-1/2 h-10"
            :disabled="!canAddToCart"
            @click="handleAddToCart"
          >
            <span class="flex items-center justify-center flex-row gap-2">
              <i
                class="ph ph-shopping-cart flex items-center justify-center text-lg"
              ></i>
              <span class="text-sm font-medium">
                {{ t("addToCart") }}
              </span>
            </span>
          </button>

          <div class="product-accordion mt-8 space-y-2">
            <Accordion v-model:value="accordionOpenPanel">
              <AccordionPanel :value="0">
                <AccordionHeader>{{ t("productDetails") }}</AccordionHeader>
                <AccordionContent>
                  <div class="text-gray-600 text-sm space-y-1">
                    <p
                      v-if="displayMaterial"
                      :class="{ 'text-amber-600 italic': missingMaterial }"
                    >
                      {{ displayMaterial }}
                    </p>
                    <p
                      v-if="displayCapacity"
                      :class="{ 'text-amber-600 italic': missingCapacity }"
                    >
                      {{ displayCapacity }}
                    </p>
                    <p
                      v-if="displayDimensions"
                      :class="{ 'text-amber-600 italic': missingDimensions }"
                    >
                      {{ displayDimensions }}
                    </p>
                    <p class="italic mt-2">{{ t("uniquePieceNote") }}</p>
                  </div>
                </AccordionContent>
              </AccordionPanel>
              <AccordionPanel :value="1">
                <AccordionHeader>{{ t("care") }}</AccordionHeader>
                <AccordionContent>
                  <ProductCareLabels :product="product" />
                </AccordionContent>
              </AccordionPanel>
              <AccordionPanel :value="2">
                <AccordionHeader>{{ t("delivery") }}</AccordionHeader>
                <AccordionContent>
                  <p class="text-gray-600 text-sm">
                    {{ t("deliveryPlaceholder") }}
                  </p>
                </AccordionContent>
              </AccordionPanel>
            </Accordion>
          </div>
        </div>
      </div>

      <section
        v-if="relatedProducts.length > 0"
        class="mt-16 pt-12 border-t border-gray-200"
      >
        <div
          class="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-6"
        >
          <div>
            <h2 class="text-2xl font-bold h-color-lunar-green mb-1">
              {{ t("youMightLike") }}
            </h2>
            <p class="text-gray-600 text-sm">{{ t("youMightLikeSubtitle") }}</p>
          </div>
          <component
            :is="preview ? 'span' : 'NuxtLink'"
            v-bind="preview ? {} : { to: $localePath('/produse') }"
            class="text-sm font-semibold uppercase h-color-primary"
            :class="{ 'hover:underline cursor-pointer': !preview }"
          >
            {{ t("viewAllCollection") }}
          </component>
        </div>
        <div class="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
          <ProductCard
            v-for="p in relatedProducts"
            :key="p.id"
            :product="p"
          />
        </div>
      </section>
    </div>
  </div>
</template>

<script setup>
import Accordion from "primevue/accordion";
import AccordionPanel from "primevue/accordionpanel";
import AccordionHeader from "primevue/accordionheader";
import AccordionContent from "primevue/accordioncontent";
import { useToast } from "primevue/usetoast";
import ProductCard from "~/components/ProductCard.vue";
import ProductCareLabels from "~/components/ProductCareLabels.vue";
import ProductStockStatus from "~/components/ProductStockStatus.vue";
import { resolveProductImageUrl } from "~/utils/product-image";
import {
  clampQuantityToStock,
  getProductStockQuantity,
  isProductAvailable,
} from "~/utils/product-stock";

const props = defineProps({
  product: {
    type: Object,
    required: true,
  },
  relatedProducts: {
    type: Array,
    default: () => [],
  },
  loading: {
    type: Boolean,
    default: false,
  },
  preview: {
    type: Boolean,
    default: false,
  },
});

const { t } = useI18n({ useScope: "local" });
const toast = useToast();
const { addToCart: addToCartStore, getQuantity } = useCart();

const quantity = ref(1);
const selectedImage = ref(null);
const accordionOpenPanel = ref(0);

const missingTitle = computed(
  () => props.preview && !props.product.title?.trim(),
);
const missingDescription = computed(
  () => props.preview && !props.product.description?.trim(),
);
const missingCategory = computed(
  () => props.preview && !props.product.category?.trim(),
);
const missingPrice = computed(
  () => props.preview && !(Number(props.product.price) > 0),
);
const missingMaterial = computed(
  () => props.preview && !props.product.material?.trim(),
);
const missingCapacity = computed(
  () => props.preview && !props.product.capacity?.trim(),
);
const missingDimensions = computed(
  () => props.preview && !props.product.dimensions?.trim(),
);

const formatDetailLine = (label, value, missingKey) => {
  if (value?.trim()) return `${label}: ${value.trim()}`;
  if (props.preview) return t(missingKey);
  return null;
};

const displayMaterial = computed(() =>
  formatDetailLine(t("materialLabel"), props.product.material, "missingMaterial"),
);
const displayCapacity = computed(() =>
  formatDetailLine(t("capacityLabel"), props.product.capacity, "missingCapacity"),
);
const displayDimensions = computed(() =>
  formatDetailLine(t("dimensionsLabel"), props.product.dimensions, "missingDimensions"),
);

const displayTitle = computed(() => {
  if (missingTitle.value) return t("missingTitle");
  return props.product.title;
});

const displayDescription = computed(() => {
  if (missingDescription.value) return t("missingDescription");
  return props.product.description;
});

const stockQuantity = computed(() =>
  getProductStockQuantity(props.product),
);

const isAvailable = computed(() => isProductAvailable(props.product));

const cartQuantity = computed(() =>
  props.product?.id ? getQuantity(props.product.id) : 0,
);

const maxAddableQuantity = computed(() =>
  Math.max(0, stockQuantity.value - cartQuantity.value),
);

const canIncreaseQuantity = computed(
  () => quantity.value < maxAddableQuantity.value,
);

const canAddToCart = computed(
  () => isAvailable.value && maxAddableQuantity.value > 0,
);

watch(
  maxAddableQuantity,
  (max) => {
    if (max <= 0) {
      quantity.value = 1;
      return;
    }
    if (quantity.value > max) {
      quantity.value = max;
    }
  },
  { immediate: true },
);

function decreaseQuantity() {
  quantity.value = Math.max(1, quantity.value - 1);
}

function increaseQuantity() {
  if (!canIncreaseQuantity.value) {
    showStockLimitToast();
    return;
  }
  quantity.value = Math.min(quantity.value + 1, maxAddableQuantity.value);
}

function onQuantityChange() {
  const max = maxAddableQuantity.value;
  if (max <= 0) {
    quantity.value = 1;
    return;
  }
  const clamped = clampQuantityToStock(quantity.value, max);
  if (clamped !== quantity.value) {
    showStockLimitToast();
  }
  quantity.value = clamped;
}

function showStockLimitToast() {
  toast.add({
    severity: "warn",
    summary: t("stockLimitTitle"),
    detail: t("stockLimitDetail"),
    life: 3500,
  });
}

const productImages = computed(() => {
  if (props.product.images?.length) {
    return props.product.images.map(resolveProductImageUrl);
  }
  if (props.product.image) {
    return [resolveProductImageUrl(props.product.image)];
  }
  return [];
});

const hasImages = computed(() => productImages.value.length > 0);

watch(
  productImages,
  (images) => {
    selectedImage.value = images[0] || null;
  },
  { immediate: true },
);

function handleAddToCart() {
  if (props.preview) {
    toast.add({
      severity: "info",
      summary: t("previewCartTitle"),
      detail: t("previewCartDetail"),
      life: 4000,
    });
    quantity.value = 1;
    return;
  }

  if (!props.product?.id) {
    return;
  }

  const maxTotal = stockQuantity.value;
  const before = cartQuantity.value;
  const requested = quantity.value;

  addToCartStore(props.product.id, requested, maxTotal).then(() => {
    const after = getQuantity(props.product.id);
    if (
      (after === before && maxAddableQuantity.value <= 0) ||
      after < before + requested
    ) {
      showStockLimitToast();
    }
    quantity.value = 1;
  });
}
</script>

<style scoped lang="scss">
@use "~/assets/scss/_variables.scss" as *;
@use "sass:color";

.quantity-input::-webkit-outer-spin-button,
.quantity-input::-webkit-inner-spin-button {
  -webkit-appearance: none;
  margin: 0;
}
.quantity-input {
  -moz-appearance: textfield;
  appearance: textfield;
}
.quantity-input:focus {
  outline: none;
  border: none;
  box-shadow: none;
}

.product-quote {
  margin: 0 0 1.5rem;
  padding: 0.125rem 0 0.125rem 1rem;
  border-left: 3px solid $color-primary;
  color: $lunar-green;

  p {
    margin: 0;
    font-style: italic;
    font-size: 1rem;
    line-height: 1.65;
  }

  &--missing p {
    color: #d97706;
  }
}

$accordion-hover: color.adjust($color-secondary, $lightness: -4%);

.product-accordion :deep(.p-accordion),
.product-accordion :deep(.p-accordionpanel),
.product-accordion :deep(.p-accordionheader),
.product-accordion :deep(.p-accordioncontent),
.product-accordion :deep(.p-accordioncontent-content) {
  background-color: $color-secondary !important;
}
.product-accordion :deep(.p-accordionpanel-active .p-accordionheader),
.product-accordion :deep(.p-accordionheader[data-p-active="true"]) {
  background-color: $color-secondary !important;
}
.product-accordion :deep(.p-accordionheader) {
  background-color: $color-secondary !important;
  transition: background-color 0.2s;
  &:hover {
    background-color: $accordion-hover !important;
  }
}
.product-accordion :deep(.p-accordionheader-toggle-icon) {
  color: $color-primary !important;
}
</style>

<i18n lang="json">
{
  "en": {
    "breadcrumb": { "home": "Home", "products": "Products" },
    "missingTitle": "Title needs to be added",
    "missingDescription": "Description needs to be added",
    "missingCategory": "Category needs to be added",
    "missingPrice": "Price needs to be added",
    "missingImages": "Add images to see them here",
    "categoryLabel": "Category",
    "setBadge": "Set",
    "inStock": "In stock",
    "limitedStock": "Limited stock",
    "lastProduct": "Last item",
    "outOfStock": "Out of stock",
    "stockLimitTitle": "Stock limit reached",
    "stockLimitDetail": "You cannot add more items than available stock.",
    "cartStockLimit": "Maximum quantity already in cart.",
    "addToCart": "Add to cart",
    "soldBy": "Sold by",
    "decreaseQty": "Decrease quantity",
    "increaseQty": "Increase quantity",
    "productDetails": "Product details",
    "materialLabel": "Material",
    "capacityLabel": "Capacity",
    "dimensionsLabel": "Dimensions",
    "missingMaterial": "Material needs to be added",
    "missingCapacity": "Capacity needs to be added",
    "missingDimensions": "Dimensions need to be added",
    "care": "Care",
    "delivery": "Delivery",
    "materialPlaceholder": "Material: Textured beige clay, ecological glaze.",
    "capacityPlaceholder": "Capacity: Approximately 350ml.",
    "dimensionsPlaceholder": "Dimensions: 9cm height x 8cm diameter.",
    "uniquePieceNote": "Items are handmade; slight differences in color, texture, or dimensions may occur.",
    "carePlaceholder": "Hand wash recommended. Avoid dishwasher and microwave.",
    "deliveryPlaceholder": "Delivery within 3-5 business days. Free shipping for orders over 200 RON.",
    "youMightLike": "You might also like",
    "youMightLikeSubtitle": "Other pieces crafted with the same passion.",
    "viewAllCollection": "View all collection",
    "previewCartTitle": "Preview mode",
    "previewCartDetail": "This is a preview — the product is not published yet."
  },
  "ro": {
    "breadcrumb": { "home": "Acasă", "products": "Produse" },
    "missingTitle": "Trebuie adăugat titlu",
    "missingDescription": "Trebuie adăugată descriere",
    "missingCategory": "Trebuie adăugată categorie",
    "missingPrice": "Trebuie adăugat preț",
    "missingImages": "Adaugă imagini pentru a le vedea aici",
    "categoryLabel": "Categorie",
    "setBadge": "Set",
    "inStock": "În stoc",
    "limitedStock": "Stoc limitat",
    "lastProduct": "Ultimul produs",
    "outOfStock": "Stoc epuizat",
    "stockLimitTitle": "Limită de stoc atinsă",
    "stockLimitDetail": "Nu poți adăuga mai multe bucăți decât stocul disponibil.",
    "cartStockLimit": "Cantitatea maximă este deja în coș.",
    "addToCart": "Adaugă în coș",
    "soldBy": "Vândut de",
    "decreaseQty": "Scade cantitatea",
    "increaseQty": "Crește cantitatea",
    "productDetails": "Detalii produs",
    "materialLabel": "Material",
    "capacityLabel": "Capacitate",
    "dimensionsLabel": "Dimensiuni",
    "missingMaterial": "Trebuie adăugat material",
    "missingCapacity": "Trebuie adăugată capacitate",
    "missingDimensions": "Trebuie adăugate dimensiuni",
    "care": "Îngrijire",
    "delivery": "Livrare",
    "materialPlaceholder": "Material: Argilă bej texturată, glazură ecologică.",
    "capacityPlaceholder": "Capacitate: Aproximativ 350ml.",
    "dimensionsPlaceholder": "Dimensiuni: 9cm înălțime x 8cm diametru.",
    "uniquePieceNote": "Obiectele sunt realizate manual, pot exista mici diferente de culoare, textura sau dimensiuni.",
    "carePlaceholder": "Spălare recomandată la mână. Evitați mașina de spălat vase și cuptorul cu microunde.",
    "deliveryPlaceholder": "Livrare în 3-5 zile lucrătoare. Transport gratuit pentru comenzi peste 200 RON.",
    "youMightLike": "S-ar putea să-ți placă",
    "youMightLikeSubtitle": "Alte piese lucrate cu aceeași pasiune.",
    "viewAllCollection": "Vezi toată colecția",
    "previewCartTitle": "Mod previzualizare",
    "previewCartDetail": "Aceasta este o previzualizare — produsul nu este încă publicat."
  }
}
</i18n>
