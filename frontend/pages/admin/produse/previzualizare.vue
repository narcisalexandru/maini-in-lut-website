<template>
  <div class="product-preview-page">
    <div class="product-preview-page__banner">
      <div class="product-preview-page__banner-inner">
        <span class="product-preview-page__banner-text">
          <i class="ph ph-eye"></i>
          {{ t("banner") }}
        </span>
        <NuxtLink
          v-if="draft?.returnPath"
          :to="draft.returnPath"
          class="product-preview-page__back-btn"
        >
          <i class="ph ph-arrow-left"></i>
          {{ t("backToEdit") }}
        </NuxtLink>
      </div>
    </div>

    <ProductPageView
      v-if="draft"
      :product="previewProduct"
      :related-products="relatedProducts"
      :loading="loadingRelated"
      preview
    />
  </div>
</template>

<script setup>
import ProductPageView from "~/components/ProductPageView.vue";

definePageMeta({
  layout: "default",
  middleware: ["auth", "admin"],
});

const { t } = useI18n({ useScope: "local" });
const localePath = useLocalePath();
const router = useRouter();
const { loadDraft } = useProductDraft();
const { getMyApplication } = useArtist();
const { getBaseUrl } = useApi();

const draft = ref(null);
const artistProfile = ref(null);
const relatedProducts = ref([]);
const loadingRelated = ref(false);

const previewProduct = computed(() => {
  if (!draft.value) return {};
  return {
    id: draft.value.id ?? -1,
    title: draft.value.title || "",
    description: draft.value.description || "",
    price: Number(draft.value.price) || 0,
    image: draft.value.images?.[0] || "",
    images: draft.value.images || [],
    category: draft.value.category || "",
    material: draft.value.material || "",
    capacity: draft.value.capacity || "",
    dimensions: draft.value.dimensions || "",
    dishwasherSafe: draft.value.dishwasherSafe ?? false,
    microwaveSafe: draft.value.microwaveSafe ?? false,
    inStock: (draft.value.inStock ?? true) && (Number(draft.value.stockQuantity) || 0) > 0,
    isSet: draft.value.isSet ?? false,
    stockQuantity: Number(draft.value.stockQuantity) || 0,
    discount: 0,
    priceBeforeDiscount: null,
    artist: artistProfile.value
      ? {
          displayName: artistProfile.value.displayName,
          slug: artistProfile.value.slug,
        }
      : undefined,
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
    const currentId = draft.value?.id;
    relatedProducts.value = all
      .filter((p) => p.id !== currentId)
      .slice(0, 4);
  } catch {
    relatedProducts.value = [];
  } finally {
    loadingRelated.value = false;
  }
}

onMounted(async () => {
  draft.value = loadDraft();
  if (!draft.value) {
    await router.replace(localePath("/admin/produse"));
    return;
  }

  try {
    artistProfile.value = await getMyApplication();
  } catch {
    artistProfile.value = null;
  }

  await fetchRelatedProducts();
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
    "backToEdit": "Înapoi la editare"
  },
  "en": {
    "banner": "Preview mode — this is how the product page will look on the site",
    "backToEdit": "Back to editing"
  }
}
</i18n>
