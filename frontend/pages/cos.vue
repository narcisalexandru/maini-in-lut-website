<template>
  <div class="maini-ui__section md:px-4">
    <ClientOnly>
      <div class="maini-ui__container-products">
        <!-- Breadcrumb -->
        <nav
          class="flex mb-6 text-sm h-color-dusty-gray"
          aria-label="Breadcrumb"
        >
          <ol class="flex flex-wrap items-center gap-1">
            <li>
              <NuxtLink :to="$localePath('/')" class="hover:h-color-primary">
                {{ t("breadcrumb.home") }}
              </NuxtLink>
            </li>
            <li><span class="mx-1">/</span></li>
            <li>
              <span class="h-color-lunar-green font-medium">{{
                t("breadcrumb.cart")
              }}</span>
            </li>
          </ol>
        </nav>

        <div class="flex flex-col lg:flex-row gap-8 lg:gap-12">
          <!-- Left: Cart items -->
          <div class="flex-1">
            <h1 class="text-2xl md:text-3xl font-bold h-color-lunar-green mb-1">
              {{ t("title") }}
            </h1>
            <p class="text-gray-600 mb-6">
              {{ t("subtitle") }}
            </p>

            <div v-if="cartProducts.length === 0" class="py-12 text-center">
              <i
                class="ph ph-shopping-cart text-6xl mb-4 opacity-50 h-color-lunar-green"
              ></i>
              <p class="text-lg h-color-lunar-green">{{ t("empty") }}</p>
              <NuxtLink
                :to="$localePath('/produse')"
                class="inline-flex items-center gap-2 mt-4 h-color-primary font-medium hover:underline"
              >
                <i class="ph ph-arrow-left"></i>
                {{ t("continueShopping") }}
              </NuxtLink>
            </div>

            <template v-else>
              <ul class="space-y-6">
                <li
                  v-for="item in cartProducts"
                  :key="item.product.id"
                  class="flex flex-col sm:flex-row gap-4 p-4 bg-white rounded-lg shadow-sm border border-gray-100"
                >
                  <NuxtLink
                    :to="$localePath(`/produs/${item.product.id}`)"
                    class="flex-shrink-0 w-full sm:w-24 h-24 rounded-lg overflow-hidden bg-gray-100"
                  >
                    <img
                      :src="item.product.image"
                      :alt="item.product.title"
                      class="w-full h-full object-cover"
                    />
                  </NuxtLink>
                  <div class="flex-1 min-w-0">
                    <NuxtLink
                      :to="$localePath(`/produs/${item.product.id}`)"
                      class="font-semibold text-gray-800 hover:h-color-primary block"
                    >
                      {{ item.product.title }}
                    </NuxtLink>
                    <p class="text-sm text-gray-500 mt-0.5 line-clamp-2">
                      {{ item.product.description }}
                    </p>
                    <div class="flex flex-wrap items-center gap-3 mt-2">
                      <div
                        class="flex items-center border border-gray-300 rounded-lg overflow-hidden"
                      >
                        <button
                          type="button"
                          class="w-8 h-8 flex items-center justify-center cursor-pointer transition-colors"
                          :aria-label="t('decreaseQty')"
                          @click="
                            setQuantity(
                              item.product.id,
                              Math.max(1, item.quantity - 1),
                            )
                          "
                        >
                          <i class="ph ph-minus text-xs"></i>
                        </button>
                        <input
                          :value="item.quantity"
                          type="number"
                          min="1"
                          class="quantity-input w-10 h-8 text-center h-color-palm-leaf border-none focus:outline-none focus:ring-0 focus:border-none"
                          @input="onQuantityInput(item.product.id, $event)"
                        />
                        <button
                          type="button"
                          class="w-8 h-8 flex items-center justify-center cursor-pointer transition-colors"
                          :aria-label="t('increaseQty')"
                          @click="
                            setQuantity(item.product.id, item.quantity + 1)
                          "
                        >
                          <i class="ph ph-plus text-xs"></i>
                        </button>
                      </div>
                    </div>
                  </div>
                  <div
                    class="flex sm:flex-col sm:items-end justify-between sm:justify-start gap-2"
                  >
                    <button
                      type="button"
                      class="p-2 text-gray-400 hover:text-red-500 transition-colors self-start sm:self-auto"
                      :aria-label="t('remove')"
                      @click="removeFromCart(item.product.id)"
                    >
                      <i class="ph ph-trash text-lg"></i>
                    </button>
                    <span class="h-font-weight-600 h-color-lunar-green">
                      {{ itemLineTotal(item) }} RON
                    </span>
                  </div>
                </li>
              </ul>

              <NuxtLink
                :to="$localePath('/produse')"
                class="inline-flex items-center gap-2 mt-6 h-color-primary font-medium hover:underline"
              >
                <i class="ph ph-arrow-left"></i>
                {{ t("continueShopping") }}
              </NuxtLink>
            </template>
          </div>

          <!-- Right: Order summary -->
          <aside
            v-if="cartProducts.length > 0"
            class="lg:w-80 flex-shrink-0 min-w-0"
          >
            <div
              class="bg-white rounded-lg shadow-sm border border-gray-100 p-6 sticky top-4 min-w-0 overflow-hidden"
            >
              <h2 class="text-lg font-bold text-gray-800 mb-4">
                {{ t("summaryTitle") }}
              </h2>
              <dl class="space-y-2 mb-4">
                <div class="flex justify-between text-gray-600">
                  <dt>{{ t("subtotal") }}</dt>
                  <dd>{{ subtotal }} RON</dd>
                </div>
                <div class="flex justify-between text-gray-600">
                  <dt>{{ t("delivery") }}</dt>
                  <dd>{{ deliveryFee }} RON</dd>
                </div>
                <div
                  class="flex justify-between text-lg font-bold h-color-lunar-green pt-2 border-t border-gray-200"
                >
                  <dt>{{ t("total") }}</dt>
                  <dd>{{ total }} RON</dd>
                </div>
              </dl>
              <button
                type="button"
                class="maini-ui-button__buy w-full py-3 rounded-lg font-semibold flex items-center justify-center gap-2"
              >
                <i class="ph ph-credit-card"></i>
                {{ t("checkout") }}
              </button>
              <p class="text-xs text-gray-500 mt-3 text-center">
                {{ t("securePayment") }}
              </p>
              <div class="mt-4 pt-4 border-t border-gray-100">
                <label class="block text-sm font-medium text-gray-700 mb-1">
                  {{ t("promoLabel") }}
                </label>
                <div class="flex gap-2 min-w-0">
                  <div
                    class="flex flex-1 min-w-0 items-center border border-gray-300 rounded-lg overflow-hidden"
                  >
                    <input
                      v-model="promoCode"
                      type="text"
                      :placeholder="t('promoPlaceholder')"
                      class="cart-page-input min-w-0 flex-1 px-3 py-2 h-10 border-none h-color-palm-leaf text-sm focus:outline-none focus:ring-0 focus:border-none"
                    />
                  </div>
                  <button
                    type="button"
                    class="flex-shrink-0 px-4 py-2 rounded-lg border border-gray-300 text-sm font-medium hover:bg-gray-50 transition-colors whitespace-nowrap"
                  >
                    {{ t("promoApply") }}
                  </button>
                </div>
              </div>
            </div>
          </aside>
        </div>
      </div>
      <template #fallback>
        <div class="maini-ui__container-products py-12 flex justify-center">
          <i class="ph ph-spinner text-4xl animate-spin h-color-primary"></i>
        </div>
      </template>
    </ClientOnly>
  </div>
</template>

<script setup>
defineI18nRoute({
  paths: {
    ro: "/cos",
    en: "/cart",
  },
});

const { t } = useI18n({
  useScope: "local",
});

const { cartItems, setQuantity, removeFromCart } = useCart();
const allProducts = ref([]);
const promoCode = ref("");

const cartProducts = computed(() => {
  const products = allProducts.value;
  return cartItems.value
    .map((item) => {
      const product = products.find((p) => p.id === item.productId);
      return product ? { product, quantity: item.quantity } : null;
    })
    .filter(Boolean);
});

const subtotal = computed(() =>
  cartProducts.value.reduce(
    (sum, { product, quantity }) => sum + Number(product.price) * quantity,
    0,
  ),
);

const DELIVERY_FEE = 15;
const deliveryFee = computed(() => DELIVERY_FEE);

const total = computed(() => subtotal.value + deliveryFee.value);

function itemLineTotal({ product, quantity }) {
  return (Number(product.price) * quantity).toFixed(0);
}

function onQuantityInput(productId, e) {
  const raw = e?.target?.value;
  const qty = parseInt(raw, 10);
  setQuantity(productId, Number.isFinite(qty) && qty >= 1 ? qty : 1);
}

onMounted(async () => {
  const base = import.meta.env.VITE_BACKEND_URL || "";
  try {
    const res = await fetch(`${base}/products`);
    if (res.ok) {
      allProducts.value = await res.json();
    }
  } catch (e) {
    console.error("Failed to fetch products for cart:", e);
  }
});
</script>

<style scoped>
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
</style>

<i18n lang="json">
{
  "en": {
    "breadcrumb": {
      "home": "Home",
      "cart": "Shopping cart"
    },
    "title": "Your Cart",
    "subtitle": "Each piece is unique, handcrafted with care in our workshop.",
    "empty": "Your cart is empty.",
    "continueShopping": "Continue shopping",
    "summaryTitle": "Order Summary",
    "subtotal": "Subtotal",
    "delivery": "Delivery",
    "total": "Total",
    "checkout": "Finalize Order",
    "securePayment": "Secure payment. Return options within 14 days.",
    "promoLabel": "Promotional code?",
    "promoPlaceholder": "Enter code",
    "promoApply": "Apply",
    "decreaseQty": "Decrease quantity",
    "increaseQty": "Increase quantity",
    "remove": "Remove item"
  },
  "ro": {
    "breadcrumb": {
      "home": "Acasă",
      "cart": "Coș de cumpărături"
    },
    "title": "Coșul tău",
    "subtitle": "Fiecare piesă este unică, modelată manual cu grijă în atelierul nostru.",
    "empty": "Coșul tău este gol.",
    "continueShopping": "Continuă cumpărăturile",
    "summaryTitle": "Sumar Comandă",
    "subtotal": "Subtotal",
    "delivery": "Livrare",
    "total": "Total",
    "checkout": "Finalizează Comanda",
    "securePayment": "Plată securizată. Opțiuni de retur în 14 zile.",
    "promoLabel": "Cod promoțional?",
    "promoPlaceholder": "Introdu codul",
    "promoApply": "Aplică",
    "decreaseQty": "Scade cantitatea",
    "increaseQty": "Crește cantitatea",
    "remove": "Elimină din coș"
  }
}
</i18n>
