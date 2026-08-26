<template>
  <div v-if="!loading && !product" class="maini-ui__section md:px-4 py-16 text-center text-gray-500">
    <p>Produsul nu a fost găsit.</p>
  </div>
  <ProductPageView
    v-else
    :product="product || {}"
    :related-products="relatedProducts"
    :loading="loading"
  />
</template>

<script setup>
import ProductPageView from "~/components/ProductPageView.vue";
import { buildGuestCartHeaders } from "~/utils/guest-cart-id";

const route = useRoute();
const id = computed(() => route.params.id);

const product = ref(null);
const loading = ref(true);
const relatedProducts = ref([]);

defineI18nRoute({
  paths: {
    ro: "/produs/[id]",
    en: "/products/[id]",
  },
});

async function fetchProduct() {
  loading.value = true;
  try {
    const token =
      import.meta.client ? localStorage.getItem("token") : null;
    const headers = {
      ...buildGuestCartHeaders(),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };
    const res = await fetch(
      `${import.meta.env.VITE_BACKEND_URL}/products/${id.value}`,
      { headers },
    );
    if (!res.ok) {
      product.value = null;
      return;
    }
    const data = await res.json();
    const images = data.images?.length
      ? data.images
      : data.image
        ? [data.image]
        : [];
    product.value = { ...data, images };
  } catch (e) {
    console.error("Failed to fetch product:", e);
    product.value = null;
  } finally {
    loading.value = false;
  }
}

async function fetchRelated() {
  try {
    const token =
      import.meta.client ? localStorage.getItem("token") : null;
    const headers = {
      ...buildGuestCartHeaders(),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };
    const res = await fetch(`${import.meta.env.VITE_BACKEND_URL}/products`, {
      headers,
    });
    const all = await res.json();
    const others = all.filter((p) => p.id !== product.value?.id);
    relatedProducts.value = others.slice(0, 4);
  } catch (e) {
    console.error("Failed to fetch related:", e);
  }
}

watch(id, fetchProduct, { immediate: true });
watch(product, (p) => {
  if (p) fetchRelated();
});
</script>
