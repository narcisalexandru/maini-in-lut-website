<template>
  <div class="product-preview-page">
    <div class="product-preview-page__banner">
      <div class="product-preview-page__banner-inner">
        <span class="product-preview-page__banner-text">
          <i class="ph ph-eye"></i>
          {{ t("banner") }}
        </span>
        <NuxtLink
          :to="localePath('/admin/produse')"
          class="product-preview-page__back-btn"
        >
          <i class="ph ph-arrow-left"></i>
          {{ t("backToAdmin") }}
        </NuxtLink>
      </div>
    </div>

    <div v-if="loading" class="flex justify-center py-16">
      <i class="ph ph-spinner text-4xl animate-spin h-color-primary"></i>
    </div>

    <ProductPageView
      v-else-if="previewProduct"
      :product="previewProduct"
      :related-products="relatedProducts"
      :loading="loadingRelated"
      preview
    />
  </div>
</template>

<script setup>
import ProductPageView from "~/components/ProductPageView.vue";
import { mergeProductWithProposal } from "~/utils/admin-product";

definePageMeta({
  layout: "default",
  middleware: ["auth", "admin"],
});

const { t } = useI18n({ useScope: "local" });
const localePath = useLocalePath();
const router = useRouter();
const route = useRoute();
const { getProduct } = useArtist();
const { getBaseUrl } = useApi();

const productId = computed(() => Number(route.params.id));
const product = ref(null);
const loading = ref(true);
const relatedProducts = ref([]);
const loadingRelated = ref(false);

const previewProduct = computed(() => {
  if (!product.value) return null;
  const merged = mergeProductWithProposal(product.value);
  return {
    ...merged,
    inStock:
      (merged.inStock ?? true) && (Number(merged.stockQuantity) || 0) > 0,
  };
});

async function fetchRelatedProducts() {
  loadingRelated.value = true;
  try {
    const res = await fetch(`${getBaseUrl()}/products`);
    if (!res.ok) {
      relatedProducts.value = [];
      return;
    }
    const all = await res.json();
    relatedProducts.value = all
      .filter((p) => p.id !== productId.value)
      .slice(0, 4);
  } catch {
    relatedProducts.value = [];
  } finally {
    loadingRelated.value = false;
  }
}

onMounted(async () => {
  if (!Number.isFinite(productId.value)) {
    await router.replace(localePath("/admin/produse"));
    return;
  }

  try {
    product.value = await getProduct(productId.value);
    await fetchRelatedProducts();
  } catch {
    await router.replace(localePath("/admin/produse"));
  } finally {
    loading.value = false;
  }
});
</script>

<style scoped lang="scss">
.product-preview-page__banner {
  position: sticky;
  top: 0;
  z-index: 50;
  background-color: #fef3c7;
  border-bottom: 1px solid #fde68a;
}

.product-preview-page__banner-inner {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  max-width: 1200px;
  margin: 0 auto;
  padding: 0.75rem 1rem;
}

.product-preview-page__banner-text {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: #92400e;
  font-size: 0.875rem;
  font-weight: 500;
}

.product-preview-page__back-btn {
  display: inline-flex;
  align-items: center;
  gap: 0.375rem;
  padding: 0.5rem 0.875rem;
  border-radius: 0.5rem;
  background-color: white;
  color: #92400e;
  font-size: 0.875rem;
  font-weight: 500;
  text-decoration: none;
  border: 1px solid #fde68a;
  transition: background-color 0.15s;

  &:hover {
    background-color: #fffbeb;
  }
}
</style>

<i18n lang="json">
{
  "ro": {
    "banner": "Mod previzualizare — așa va arăta pagina produsului pe site",
    "backToAdmin": "Înapoi la produse"
  },
  "en": {
    "banner": "Preview mode — this is how the product page will look on the site",
    "backToAdmin": "Back to products"
  }
}
</i18n>
