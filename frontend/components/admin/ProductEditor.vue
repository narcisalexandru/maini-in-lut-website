<template>
  <div>
    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
      <div class="flex items-center gap-3">
        <NuxtLink
          :to="localePath('/admin/produse')"
          class="flex items-center justify-center w-9 h-9 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50"
          :aria-label="t('back')"
        >
          <i class="ph ph-arrow-left"></i>
        </NuxtLink>
        <h1 class="text-2xl font-bold h-color-lunar-green m-0">
          {{ isEdit ? t("editProduct") : t("addProduct") }}
        </h1>
      </div>
    </div>

    <div v-if="loadingProduct" class="flex justify-center py-16">
      <i class="ph ph-spinner text-3xl animate-spin h-color-primary"></i>
    </div>

    <div v-else class="max-w-2xl flex flex-col gap-6">
      <FormInput id="title" name="title" :label="t('productTitle')" v-model="form.title" />
      <div class="flex flex-col">
        <label class="text-sm mb-1 font-medium">{{ t("description") }}</label>
        <Textarea v-model="form.description" rows="6" />
      </div>
      <FormInput id="price" name="price" :label="t('price')" type="number" v-model="form.price" />
      <ProductImageUploader v-model="form.images" />
      <FormInput id="category" name="category" :label="t('category')" v-model="form.category" />

      <div class="flex flex-col gap-4 pt-2 border-t border-gray-200">
        <h2 class="text-lg font-semibold h-color-lunar-green m-0">{{ t("availabilitySection") }}</h2>
        <label class="flex items-center gap-2 cursor-pointer">
          <Checkbox v-model="form.inStock" binary />
          <span class="text-sm">{{ t("inStock") }}</span>
        </label>
        <label class="flex items-center gap-2 cursor-pointer">
          <Checkbox v-model="form.isSet" binary />
          <span class="text-sm">{{ t("isSet") }}</span>
        </label>
        <p class="text-sm text-gray-500 m-0">{{ t("isSetHint") }}</p>
        <FormInput
          id="stockQuantity"
          name="stockQuantity"
          :label="form.isSet ? t('stockQuantitySetLabel') : t('stockQuantityLabel')"
          type="number"
          min="0"
          v-model="form.stockQuantity"
        />
        <p class="text-sm text-gray-500 m-0">
          {{ form.isSet ? t("stockQuantitySetHint") : t("stockQuantityHint") }}
        </p>
      </div>

      <div class="flex flex-col gap-4 pt-2 border-t border-gray-200">
        <h2 class="text-lg font-semibold h-color-lunar-green m-0">{{ t("productDetailsSection") }}</h2>
        <p class="text-sm text-gray-500 m-0">{{ t("productDetailsHint") }}</p>
        <FormInput id="material" name="material" :label="t('material')" v-model="form.material" />
        <FormInput id="capacity" name="capacity" :label="t('capacity')" v-model="form.capacity" />
        <FormInput id="dimensions" name="dimensions" :label="t('dimensions')" v-model="form.dimensions" />
      </div>

      <div class="flex flex-col gap-4 pt-2 border-t border-gray-200">
        <h2 class="text-lg font-semibold h-color-lunar-green m-0">{{ t("careSection") }}</h2>
        <p class="text-sm text-gray-500 m-0">{{ t("careSectionHint") }}</p>
        <label class="flex items-center gap-2 cursor-pointer">
          <Checkbox v-model="form.dishwasherSafe" binary />
          <span class="text-sm">{{ t("dishwasherSafe") }}</span>
        </label>
        <label class="flex items-center gap-2 cursor-pointer">
          <Checkbox v-model="form.microwaveSafe" binary />
          <span class="text-sm">{{ t("microwaveSafe") }}</span>
        </label>
      </div>

      <div class="flex flex-wrap gap-3 pt-2 border-t border-gray-200">
        <Button
          severity="secondary"
          icon="ph ph-eye"
          :label="t('preview')"
          @click="openPreview"
        />
        <div class="flex gap-2 ml-auto">
          <NuxtLink :to="localePath('/admin/produse')">
            <Button severity="secondary" :label="t('cancel')" />
          </NuxtLink>
          <Button
            :label="t('save')"
            :loading="saving"
            :disabled="!canSave"
            @click="saveProduct"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import Button from "primevue/button";
import Checkbox from "primevue/checkbox";
import Textarea from "primevue/textarea";
import { useToast } from "primevue/usetoast";
import FormInput from "~/components/FormInput.vue";
import ProductImageUploader from "~/components/admin/ProductImageUploader.vue";

const props = defineProps({
  productId: {
    type: Number,
    default: null,
  },
});

const isEdit = computed(() => props.productId != null);

const { t } = useI18n({ useScope: "local" });
const toast = useToast();
const localePath = useLocalePath();
const router = useRouter();
const { createProduct, updateProduct, listMyProducts } = useArtist();
const { saveDraft, loadDraft } = useProductDraft();

const form = ref({
  title: "",
  description: "",
  price: "",
  images: [],
  category: "",
  material: "",
  capacity: "",
  dimensions: "",
  dishwasherSafe: false,
  microwaveSafe: false,
  inStock: true,
  isSet: false,
  stockQuantity: "1",
});

const saving = ref(false);
const loadingProduct = ref(false);

const returnPath = computed(() =>
  isEdit.value
    ? localePath(`/admin/produse/${props.productId}/editare`)
    : localePath("/admin/produse/nou"),
);

const canSave = computed(
  () =>
    form.value.title.trim().length > 0 &&
    form.value.description.trim().length >= 10 &&
    Number(form.value.price) > 0 &&
    form.value.images.length > 0 &&
    form.value.category.trim().length > 0,
);

const buildDraft = () => ({
  id: props.productId,
  title: form.value.title,
  description: form.value.description,
  price: form.value.price,
  images: [...form.value.images],
  category: form.value.category,
  material: form.value.material,
  capacity: form.value.capacity,
  dimensions: form.value.dimensions,
  dishwasherSafe: form.value.dishwasherSafe,
  microwaveSafe: form.value.microwaveSafe,
  inStock: form.value.inStock,
  isSet: form.value.isSet,
  stockQuantity: form.value.stockQuantity,
  returnPath: returnPath.value,
});

const openPreview = () => {
  saveDraft(buildDraft());
  router.push(localePath("/admin/produse/previzualizare"));
};

const saveProduct = async () => {
  saving.value = true;
  try {
    const quantity = Math.max(0, Math.floor(Number(form.value.stockQuantity) || 0));
    const payload = {
      title: form.value.title.trim(),
      description: form.value.description.trim(),
      price: Number(form.value.price),
      images: form.value.images,
      category: form.value.category.trim(),
      material: form.value.material.trim() || null,
      capacity: form.value.capacity.trim() || null,
      dimensions: form.value.dimensions.trim() || null,
      dishwasherSafe: form.value.dishwasherSafe,
      microwaveSafe: form.value.microwaveSafe,
      inStock: form.value.inStock && quantity > 0,
      isSet: form.value.isSet,
      stockQuantity: quantity,
    };

    if (isEdit.value) {
      await updateProduct(props.productId, payload);
    } else {
      await createProduct(payload);
    }

    toast.add({ severity: "success", summary: t("saved"), life: 3000 });
    await router.push(localePath("/admin/produse"));
  } catch (error) {
    toast.add({
      severity: "error",
      summary: t("error"),
      detail: error.message,
      life: 4000,
    });
  } finally {
    saving.value = false;
  }
};

const loadProduct = async () => {
  if (!isEdit.value) return;

  loadingProduct.value = true;
  try {
    const products = await listMyProducts();
    const product = products.find((p) => p.id === props.productId);
    if (!product) {
      toast.add({ severity: "error", summary: t("notFound"), life: 4000 });
      await router.push(localePath("/admin/produse"));
      return;
    }

    if (!["DRAFT", "REJECTED"].includes(product.status)) {
      toast.add({ severity: "warn", summary: t("notEditable"), life: 4000 });
      await router.push(localePath("/admin/produse"));
      return;
    }

    form.value = {
      title: product.title,
      description: product.description,
      price: String(product.price),
      images: product.images?.length
        ? [...product.images]
        : product.image
          ? [product.image]
          : [],
      category: product.category,
      material: product.material || "",
      capacity: product.capacity || "",
      dimensions: product.dimensions || "",
      dishwasherSafe: product.dishwasherSafe ?? false,
      microwaveSafe: product.microwaveSafe ?? false,
      inStock: product.inStock ?? true,
      isSet: product.isSet ?? false,
      stockQuantity: String(product.stockQuantity ?? 1),
    };
  } catch (error) {
    toast.add({
      severity: "error",
      summary: t("error"),
      detail: error.message,
      life: 4000,
    });
    await router.push(localePath("/admin/produse"));
  } finally {
    loadingProduct.value = false;
  }
};

onMounted(async () => {
  const draft = loadDraft();
  if (draft && draft.returnPath === returnPath.value) {
    form.value = {
      title: draft.title,
      description: draft.description,
      price: draft.price,
      images: [...draft.images],
      category: draft.category,
      material: draft.material || "",
      capacity: draft.capacity || "",
      dimensions: draft.dimensions || "",
      dishwasherSafe: draft.dishwasherSafe ?? false,
      microwaveSafe: draft.microwaveSafe ?? false,
      inStock: draft.inStock ?? true,
      isSet: draft.isSet ?? false,
      stockQuantity: String(draft.stockQuantity ?? 1),
    };
    return;
  }
  await loadProduct();
});
</script>

<i18n lang="json">
{
  "ro": {
    "addProduct": "Adaugă produs",
    "editProduct": "Editează produs",
    "productTitle": "Titlu",
    "description": "Descriere",
    "price": "Preț (RON)",
    "category": "Categorie",
    "availabilitySection": "Disponibilitate",
    "inStock": "În stoc",
    "isSet": "Produs tip set",
    "isSetHint": "Bifează dacă produsul este un set (mai multe piese vândute împreună).",
    "stockQuantityLabel": "Cantitate în stoc",
    "stockQuantitySetLabel": "Cantitate seturi în stoc",
    "stockQuantityHint": "Introdu câte bucăți sunt disponibile pentru vânzare.",
    "stockQuantitySetHint": "Introdu câte seturi sunt disponibile, nu câte piese sunt într-un set.",
    "productDetailsSection": "Detalii produs",
    "productDetailsHint": "Informații afișate în secțiunea „Detalii produs” de pe pagina produsului.",
    "material": "Material",
    "capacity": "Capacitate",
    "dimensions": "Dimensiuni",
    "careSection": "Îngrijire",
    "careSectionHint": "Bifează opțiunile care se aplică produsului. Pe pagina produsului vor apărea etichete cu iconițe.",
    "dishwasherSafe": "Poate fi spălat la mașina de spălat vase",
    "microwaveSafe": "Poate fi folosit la cuptorul cu microunde",
    "preview": "Previzualizare",
    "cancel": "Anulare",
    "save": "Salvează",
    "saved": "Produs salvat",
    "error": "Eroare",
    "back": "Înapoi la produse",
    "notFound": "Produsul nu a fost găsit",
    "notEditable": "Acest produs nu poate fi editat"
  },
  "en": {
    "addProduct": "Add product",
    "editProduct": "Edit product",
    "productTitle": "Title",
    "description": "Description",
    "price": "Price (RON)",
    "category": "Category",
    "availabilitySection": "Availability",
    "inStock": "In stock",
    "isSet": "Product is a set",
    "isSetHint": "Check if the product is a set (multiple pieces sold together).",
    "stockQuantityLabel": "Stock quantity",
    "stockQuantitySetLabel": "Number of sets in stock",
    "stockQuantityHint": "Enter how many individual items are available for sale.",
    "stockQuantitySetHint": "Enter how many sets are available — not how many pieces are in one set.",
    "productDetailsSection": "Product details",
    "productDetailsHint": "Information shown in the “Product details” section on the product page.",
    "material": "Material",
    "capacity": "Capacity",
    "dimensions": "Dimensions",
    "careSection": "Care",
    "careSectionHint": "Check the options that apply to this product. Care labels with icons will appear on the product page.",
    "dishwasherSafe": "Dishwasher safe",
    "microwaveSafe": "Microwave safe",
    "preview": "Preview",
    "cancel": "Cancel",
    "save": "Save",
    "saved": "Product saved",
    "error": "Error",
    "back": "Back to products",
    "notFound": "Product not found",
    "notEditable": "This product cannot be edited"
  }
}
</i18n>
