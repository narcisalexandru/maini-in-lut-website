<template>
  <div class="maini-ui__section md:px-4">
    <div class="maini-ui__container-products">
      <!-- Breadcrumbs -->
      <nav class="flex mb-6 text-sm h-color-dusty-gray" aria-label="Breadcrumb">
        <ol class="flex flex-wrap items-center gap-1">
          <li>
            <NuxtLink :to="$localePath('/')" class="hover:h-color-primary">
              {{ t("breadcrumb.home") }}
            </NuxtLink>
          </li>
          <li><span class="mx-1">/</span></li>
          <li>
            <NuxtLink :to="$localePath('/produse')" class="hover:h-color-primary">
              {{ t("breadcrumb.products") }}
            </NuxtLink>
          </li>
          <li><span class="mx-1">/</span></li>
          <li>
            <span class="h-color-lunar-green font-medium">{{ product?.title }}</span>
          </li>
        </ol>
      </nav>

      <div v-if="loading" class="flex justify-center py-16">
        <i class="ph ph-spinner text-4xl animate-spin h-color-primary"></i>
      </div>

      <div v-else-if="product" class="flex flex-col lg:flex-row gap-8 lg:gap-12">
        <!-- Left: Product images -->
        <div class="flex-1 lg:max-w-[55%]">
          <div class="aspect-square bg-white rounded-lg overflow-hidden shadow-sm mb-4">
            <img
              :src="selectedImage || product.image"
              :alt="product.title"
              class="w-full h-full object-cover"
            />
          </div>
          <div class="flex gap-2 items-center">
            <button
              v-for="(img, idx) in productImages"
              :key="idx"
              type="button"
              class="w-20 h-20 rounded-lg overflow-hidden border-2 transition-all flex-shrink-0"
              :class="selectedImage === img ? 'h-border-color-primary ring-2 ring-[#8a9772]/30' : 'border-transparent hover:border-gray-300'"
              @click="selectedImage = img"
            >
              <img :src="img" :alt="`${product.title} ${idx + 1}`" class="w-full h-full object-cover" />
            </button>
          </div>
        </div>

        <!-- Right: Product info -->
        <div class="flex-1 lg:max-w-[45%]">
          <span
            v-if="product.popularity > 150"
            class="inline-block text-xs font-semibold tracking-wider uppercase mb-2 h-color-primary"
          >
            {{ t("limitedSeries") }}
          </span>
          <h1 class="text-2xl md:text-3xl font-bold h-color-lunar-green mb-2">
            {{ product.title }}
          </h1>
          <div class="flex items-center gap-2 mb-4">
            <span
              v-if="product.discount > 0"
              class="text-gray-400 line-through text-lg"
            >
              {{ product.priceBeforeDiscount }} RON
            </span>
            <span class="h-font-weight-600 h-color-lunar-green text-xl">
              {{ product.price }} RON
            </span>
          </div>
          <p class="text-gray-600 mb-6 leading-relaxed">
            {{ product.description }}
          </p>

          <!-- Quantity & Add to cart -->
          <div class="flex flex-wrap items-center gap-4 mb-6">
            <div class="flex items-center border border-gray-300 rounded-lg overflow-hidden">
              <button
                type="button"
                class="w-10 h-10 flex items-center justify-center hover:bg-gray-100 transition-colors"
                :aria-label="t('decreaseQty')"
                @click="quantity = Math.max(1, quantity - 1)"
              >
                <i class="ph ph-minus text-sm"></i>
              </button>
              <input
                v-model.number="quantity"
                type="number"
                min="1"
                class="w-14 h-10 text-center border-x border-gray-300 focus:outline-none focus:ring-0"
              />
              <button
                type="button"
                class="w-10 h-10 flex items-center justify-center hover:bg-gray-100 transition-colors"
                :aria-label="t('increaseQty')"
                @click="quantity = quantity + 1"
              >
                <i class="ph ph-plus text-sm"></i>
              </button>
            </div>
            <span
              v-if="product.inStock"
              class="text-sm font-medium text-green-600 uppercase"
            >
              {{ t("inStock") }}
            </span>
            <span v-else class="text-sm font-medium text-red-600 uppercase">
              {{ t("outOfStock") }}
            </span>
          </div>

          <Button
            class="maini-ui-button__buy w-full md:w-auto flex justify-center items-center gap-2 px-8 py-3"
            :disabled="!product.inStock"
            @click="addToCart"
          >
            <i class="ph ph-shopping-bag text-xl"></i>
            {{ t("addToCart") }}
          </Button>

          <!-- Accordion: Detalii, Îngrijire, Livrare -->
          <div class="mt-8 space-y-2">
            <Accordion value="0">
              <AccordionPanel :value="0">
                <AccordionHeader>{{ t("productDetails") }}</AccordionHeader>
                <AccordionContent>
                  <div class="text-gray-600 text-sm space-y-1">
                    <p>{{ t("materialPlaceholder") }}</p>
                    <p>{{ t("capacityPlaceholder") }}</p>
                    <p>{{ t("dimensionsPlaceholder") }}</p>
                    <p class="italic mt-2">{{ t("uniquePieceNote") }}</p>
                  </div>
                </AccordionContent>
              </AccordionPanel>
              <AccordionPanel :value="1">
                <AccordionHeader>{{ t("care") }}</AccordionHeader>
                <AccordionContent>
                  <p class="text-gray-600 text-sm">{{ t("carePlaceholder") }}</p>
                </AccordionContent>
              </AccordionPanel>
              <AccordionPanel :value="2">
                <AccordionHeader>{{ t("delivery") }}</AccordionHeader>
                <AccordionContent>
                  <p class="text-gray-600 text-sm">{{ t("deliveryPlaceholder") }}</p>
                </AccordionContent>
              </AccordionPanel>
            </Accordion>
          </div>
        </div>
      </div>

      <!-- You might also like -->
      <section v-if="relatedProducts.length > 0" class="mt-16 pt-12 border-t border-gray-200">
        <div class="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-6">
          <div>
            <h2 class="text-2xl font-bold h-color-lunar-green mb-1">
              {{ t("youMightLike") }}
            </h2>
            <p class="text-gray-600 text-sm">{{ t("youMightLikeSubtitle") }}</p>
          </div>
          <NuxtLink
            :to="$localePath('/produse')"
            class="text-sm font-semibold uppercase h-color-primary hover:underline"
          >
            {{ t("viewAllCollection") }}
          </NuxtLink>
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
import Button from "primevue/button";

const route = useRoute();
const id = computed(() => route.params.id);

const product = ref(null);
const loading = ref(true);
const quantity = ref(1);
const selectedImage = ref(null);

const CANA_GASCA_IMAGES = [
  '/images/products/cana_gasca_iarna.jpg',
  '/images/products/cana_gasca_vara.jpg',
  '/images/products/cana_gasca_vara_iarna.jpg',
];

const productImages = computed(() => {
  if (!product.value) return [];
  if (Number(id.value) === 1) return CANA_GASCA_IMAGES;
  const img = product.value.image;
  return [img];
});

const relatedProducts = ref([]);

const { t } = useI18n({
  useScope: "local",
});

defineI18nRoute({
  paths: {
    ro: "/produs/[id]",
    en: "/products/[id]",
  },
});

async function fetchProduct() {
  loading.value = true;
  try {
    const res = await fetch(
      `${import.meta.env.VITE_BACKEND_URL}/products/${id.value}`
    );
    if (!res.ok) {
      product.value = null;
      return;
    }
    product.value = await res.json();
    selectedImage.value = product.value.image;
  } catch (e) {
    console.error("Failed to fetch product:", e);
    product.value = null;
  } finally {
    loading.value = false;
  }
}

async function fetchRelated() {
  try {
    const res = await fetch(
      `${import.meta.env.VITE_BACKEND_URL}/products`
    );
    const all = await res.json();
    const others = all.filter((p) => p.id !== product.value?.id);
    relatedProducts.value = others.slice(0, 4);
  } catch (e) {
    console.error("Failed to fetch related:", e);
  }
}

function addToCart() {
  // TODO: integrate with cart
}

watch(id, fetchProduct, { immediate: true });
watch(product, (p) => {
  if (p) fetchRelated();
});
</script>

<i18n lang="json">
{
  "en": {
    "breadcrumb": {
      "home": "Home",
      "products": "Products"
    },
    "limitedSeries": "Limited series",
    "inStock": "In stock",
    "outOfStock": "Out of stock",
    "addToCart": "Add to cart",
    "decreaseQty": "Decrease quantity",
    "increaseQty": "Increase quantity",
    "productDetails": "Product details",
    "care": "Care",
    "delivery": "Delivery",
    "materialPlaceholder": "Material: Textured beige clay, ecological glaze.",
    "capacityPlaceholder": "Capacity: Approximately 350ml.",
    "dimensionsPlaceholder": "Dimensions: 9cm height x 8cm diameter.",
    "uniquePieceNote": "Each piece is unique, small variations in shape and color being proof of the manual process.",
    "carePlaceholder": "Hand wash recommended. Avoid dishwasher and microwave.",
    "deliveryPlaceholder": "Delivery within 3-5 business days. Free shipping for orders over 200 RON.",
    "youMightLike": "You might also like",
    "youMightLikeSubtitle": "Other pieces crafted with the same passion.",
    "viewAllCollection": "View all collection"
  },
  "ro": {
    "breadcrumb": {
      "home": "Acasă",
      "products": "Produse"
    },
    "limitedSeries": "Serie limitată",
    "inStock": "În stoc",
    "outOfStock": "Stoc epuizat",
    "addToCart": "Adaugă în coș",
    "decreaseQty": "Scade cantitatea",
    "increaseQty": "Crește cantitatea",
    "productDetails": "Detalii produs",
    "care": "Îngrijire",
    "delivery": "Livrare",
    "materialPlaceholder": "Material: Argilă bej texturată, glazură ecologică.",
    "capacityPlaceholder": "Capacitate: Aproximativ 350ml.",
    "dimensionsPlaceholder": "Dimensiuni: 9cm înălțime x 8cm diametru.",
    "uniquePieceNote": "Fiecare piesă este unică, mici variații de formă și culoare fiind o dovadă a procesului manual.",
    "carePlaceholder": "Spălare recomandată la mână. Evitați mașina de spălat vase și cuptorul cu microunde.",
    "deliveryPlaceholder": "Livrare în 3-5 zile lucrătoare. Transport gratuit pentru comenzi peste 200 RON.",
    "youMightLike": "S-ar putea să-ți placă",
    "youMightLikeSubtitle": "Alte piese lucrate cu aceeași pasiune.",
    "viewAllCollection": "Vezi toată colecția"
  }
}
</i18n>
