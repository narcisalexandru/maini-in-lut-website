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
          {{
            superAdminEdit
              ? t("editProductAdmin")
              : changeRequest
                ? t("editListedProduct")
                : isEdit
                  ? t("editProduct")
                  : t("addProduct")
          }}
        </h1>
      </div>
    </div>

    <div v-if="loadingProduct" class="flex justify-center py-16">
      <i class="ph ph-spinner text-3xl animate-spin h-color-primary"></i>
    </div>

    <div v-else class="max-w-2xl flex flex-col gap-6">
      <p
        v-if="changeRequest"
        class="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900 m-0"
      >
        {{ t("changeRequestHint") }}
      </p>
      <p
        v-if="superAdminEdit"
        class="rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-900 m-0"
      >
        {{ t("superAdminEditHint") }}
      </p>
      <FormInput id="title" name="title" :label="t('productTitle')" v-model="form.title" />
      <div class="flex flex-col">
        <label class="text-sm mb-1 font-medium">{{ t("description") }}</label>
        <Textarea v-model="form.description" rows="6" />
      </div>
      <FormInput
        id="price"
        name="price"
        :label="t('price')"
        type="number"
        min="0"
        step="0.01"
        v-model="form.price"
        @blur="clampPrice"
      />
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
          step="1"
          v-model="form.stockQuantity"
          @blur="clampStockQuantity"
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

      <div
        v-if="superAdminEdit"
        class="flex flex-col gap-4 pt-2 border-t border-gray-200"
      >
        <h2 class="text-lg font-semibold h-color-lunar-green m-0">{{ t("discountSection") }}</h2>
        <p class="text-sm text-gray-500 m-0">{{ t("discountSectionHint") }}</p>
        <FormInput
          id="discount"
          name="discount"
          :label="t('discount')"
          type="number"
          min="0"
          max="100"
          step="1"
          v-model="form.discount"
        />
      </div>

      <div class="flex flex-wrap gap-3 pt-2 border-t border-gray-200">
        <p v-if="!changeRequest && !superAdminEdit && draftSavedHint" class="w-full text-xs text-gray-500 m-0 flex items-center gap-1.5">
          <i v-if="draftSaving" class="ph ph-spinner animate-spin"></i>
          <i v-else class="ph ph-cloud-check"></i>
          {{ draftSavedHint }}
        </p>
        <Button
          severity="secondary"
          icon="ph ph-eye"
          :label="t('preview')"
          @click="openPreview"
        />
        <Button
          v-if="!superAdminEdit"
          severity="secondary"
          icon="ph ph-arrow-counter-clockwise"
          :label="t('reset')"
          :disabled="saving || draftSaving"
          @click="resetDialogVisible = true"
        />
        <Button
          v-else
          severity="secondary"
          icon="ph ph-arrow-counter-clockwise"
          :label="t('reset')"
          :disabled="saving"
          @click="resetSuperAdminForm"
        />
        <div class="flex gap-2 ml-auto">
          <NuxtLink :to="localePath('/admin/produse')">
            <Button severity="secondary" :label="t('cancel')" />
          </NuxtLink>
          <Button
            :label="changeRequest ? t('submitChanges') : t('save')"
            :loading="saving"
            :disabled="!canSave"
            @click="saveProduct"
          />
        </div>
      </div>
    </div>

    <Dialog
      v-model:visible="resetDialogVisible"
      modal
      :header="t('resetTitle')"
      :style="{ width: '480px' }"
    >
      <p class="text-sm h-color-lunar-green m-0">{{ changeRequest ? t("resetChangesConfirm") : t("resetConfirm") }}</p>
      <template #footer>
        <Button
          severity="secondary"
          :label="t('cancel')"
          :disabled="isResetting"
          @click="resetDialogVisible = false"
        />
        <Button
          severity="danger"
          :label="t('resetConfirmAction')"
          :loading="isResetting"
          @click="confirmReset"
        />
      </template>
    </Dialog>
  </div>
</template>

<script setup>
import { useDebounceFn } from "@vueuse/core";
import Button from "primevue/button";
import Checkbox from "primevue/checkbox";
import Dialog from "primevue/dialog";
import Textarea from "primevue/textarea";
import { useToast } from "primevue/usetoast";
import FormInput from "~/components/FormInput.vue";
import ProductImageUploader from "~/components/admin/ProductImageUploader.vue";

const DRAFT_PLACEHOLDER_IMAGE = "/images/logo.png";
const DRAFT_DEFAULT_TITLE = "Ciornă";
const DRAFT_DEFAULT_DESCRIPTION = "Descriere în lucru";
const DRAFT_DEFAULT_CATEGORY = "Necategorizat";

const props = defineProps({
  productId: {
    type: Number,
    default: null,
  },
  changeRequest: {
    type: Boolean,
    default: false,
  },
  superAdminEdit: {
    type: Boolean,
    default: false,
  },
});

const isEdit = computed(() => props.productId != null);

const { t } = useI18n({ useScope: "local" });
const toast = useToast();
const localePath = useLocalePath();
const router = useRouter();
const {
  createProduct,
  updateProduct,
  submitProductChanges,
  getActiveDraft,
  getProduct,
  saveProductDraft,
  deleteProductDraft,
} = useArtist();
const { saveDraft, loadDraft, clearDraft } = useProductDraft();

const createEmptyForm = () => ({
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
  discount: "0",
});

const form = ref(createEmptyForm());
const draftProductId = ref(null);
const saving = ref(false);
const loadingProduct = ref(false);
const draftSaving = ref(false);
const lastDraftSavedAt = ref(null);
const initialFormSnapshot = ref(null);
const isResetting = ref(false);
const resetDialogVisible = ref(false);

const returnPath = computed(() => {
  if (props.superAdminEdit) {
    return localePath(`/admin/produse/${props.productId}/editare-admin`);
  }
  if (props.changeRequest) {
    return localePath(`/admin/produse/${props.productId}/modificare`);
  }
  return isEdit.value
    ? localePath(`/admin/produse/${props.productId}/editare`)
    : localePath("/admin/produse/nou");
});

const hasFormChanges = computed(() => {
  if (!initialFormSnapshot.value) return false;
  return snapshotForm() !== initialFormSnapshot.value;
});

const canSave = computed(() => {
  const valid =
    form.value.title.trim().length > 0 &&
    form.value.description.trim().length >= 10 &&
    Number(form.value.price) > 0 &&
    form.value.images.length > 0 &&
    form.value.category.trim().length > 0;

  if (props.changeRequest) {
    return valid && hasFormChanges.value;
  }
  return valid;
});

const draftSavedHint = computed(() => {
  if (draftSaving.value) return t("draftSaving");
  if (!lastDraftSavedAt.value) return "";
  return t("draftSaved");
});

const clampPrice = () => {
  if (form.value.price === "") return;
  const num = Number(form.value.price);
  if (!Number.isFinite(num) || num < 0) {
    form.value.price = "0";
    return;
  }
  form.value.price = String(num);
};

const clampStockQuantity = () => {
  if (form.value.stockQuantity === "") return;
  const num = Number(form.value.stockQuantity);
  if (!Number.isFinite(num) || num < 0) {
    form.value.stockQuantity = "0";
    return;
  }
  form.value.stockQuantity = String(Math.floor(num));
};

const snapshotForm = () => JSON.stringify(form.value);

const hasDraftContent = () => {
  const f = form.value;
  return (
    f.title.trim().length > 0 ||
    f.description.trim().length > 0 ||
    f.price !== "" ||
    f.images.length > 0 ||
    f.category.trim().length > 0 ||
    f.material.trim().length > 0 ||
    f.capacity.trim().length > 0 ||
    f.dimensions.trim().length > 0
  );
};

const normalizeProductImages = (product) => {
  const images = product.images?.length
    ? [...product.images]
    : product.image
      ? [product.image]
      : [];
  return images.filter((img) => img !== DRAFT_PLACEHOLDER_IMAGE);
};

const applyProductToForm = (product) => {
  const basePrice =
    props.superAdminEdit &&
    Number(product.discount) > 0 &&
    product.priceBeforeDiscount != null
      ? product.priceBeforeDiscount
      : product.price;

  form.value = {
    title: product.title === DRAFT_DEFAULT_TITLE ? "" : product.title,
    description:
      product.description === DRAFT_DEFAULT_DESCRIPTION
        ? ""
        : product.description,
    price: Number(basePrice) === 0.01 ? "" : String(basePrice),
    images: normalizeProductImages(product),
    category:
      product.category === DRAFT_DEFAULT_CATEGORY ? "" : product.category,
    material: product.material || "",
    capacity: product.capacity || "",
    dimensions: product.dimensions || "",
    dishwasherSafe: product.dishwasherSafe ?? false,
    microwaveSafe: product.microwaveSafe ?? false,
    inStock: product.inStock ?? true,
    isSet: product.isSet ?? false,
    stockQuantity: String(product.stockQuantity ?? 1),
    discount: String(product.discount ?? 0),
  };
  initialFormSnapshot.value = snapshotForm();
};

const buildSavePayload = () => {
  const quantity = Math.max(
    0,
    Math.floor(Number(form.value.stockQuantity) || 0),
  );
  const payload = {
    title: form.value.title.trim(),
    description: form.value.description.trim(),
    price: Math.max(0, Number(form.value.price)),
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

  if (props.superAdminEdit) {
    const discount = Math.max(
      0,
      Math.min(100, Number(form.value.discount) || 0),
    );
    const basePrice = Math.max(0, Number(form.value.price));
    payload.discount = discount;
    if (discount > 0) {
      payload.priceBeforeDiscount = Math.round(basePrice * 100) / 100;
      payload.price =
        Math.round(basePrice * (1 - discount / 100) * 100) / 100;
    } else {
      payload.price = basePrice;
      payload.priceBeforeDiscount = null;
    }
  }

  return payload;
};

const buildDraftPayload = () => {
  const quantity = Math.max(0, Math.floor(Number(form.value.stockQuantity) || 0));
  const payload = {
    material: form.value.material.trim() || null,
    capacity: form.value.capacity.trim() || null,
    dimensions: form.value.dimensions.trim() || null,
    dishwasherSafe: form.value.dishwasherSafe,
    microwaveSafe: form.value.microwaveSafe,
    inStock: form.value.inStock && quantity > 0,
    isSet: form.value.isSet,
    stockQuantity: quantity,
  };

  if (form.value.title.trim()) payload.title = form.value.title.trim();
  if (form.value.description.trim()) {
    payload.description = form.value.description.trim();
  }
  if (form.value.price !== "") {
    payload.price = Math.max(0, Number(form.value.price));
  }
  if (form.value.images.length > 0) payload.images = form.value.images;
  if (form.value.category.trim()) payload.category = form.value.category.trim();

  const id = draftProductId.value ?? props.productId;
  if (id) payload.id = id;

  return payload;
};

const buildDraft = () => ({
  id: draftProductId.value ?? props.productId,
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

const persistDraft = async () => {
  if (props.changeRequest || props.superAdminEdit || isResetting.value || !hasDraftContent()) return;
  if (snapshotForm() === initialFormSnapshot.value && lastDraftSavedAt.value) {
    return;
  }

  draftSaving.value = true;
  try {
    const saved = await saveProductDraft(buildDraftPayload());
    draftProductId.value = saved.id;
    lastDraftSavedAt.value = new Date();
    initialFormSnapshot.value = snapshotForm();
  } catch (error) {
    console.error("Failed to auto-save product draft:", error);
  } finally {
    draftSaving.value = false;
  }
};

const debouncedPersistDraft = useDebounceFn(() => {
  void persistDraft();
}, 1500);

const openPreview = async () => {
  await persistDraft();
  saveDraft(buildDraft());
  router.push(localePath("/admin/produse/previzualizare"));
};

const saveProduct = async () => {
  saving.value = true;
  try {
    const payload = buildSavePayload();
    const existingId = draftProductId.value ?? props.productId;
    if (props.changeRequest) {
      await submitProductChanges(props.productId, payload);
      toast.add({ severity: "success", summary: t("changesSubmitted"), life: 3000 });
    } else if (existingId) {
      await updateProduct(existingId, payload);
      toast.add({ severity: "success", summary: t("saved"), life: 3000 });
    } else {
      await createProduct(payload);
      toast.add({ severity: "success", summary: t("saved"), life: 3000 });
    }

    clearDraft();
    if (props.superAdminEdit) {
      await router.push(localePath(`/admin/produse/${props.productId}/detalii`));
    } else {
      await router.push(localePath("/admin/produse"));
    }
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

const confirmReset = async () => {
  if (props.changeRequest || props.superAdminEdit) {
    if (initialFormSnapshot.value) {
      form.value = JSON.parse(initialFormSnapshot.value);
    }
    resetDialogVisible.value = false;
    return;
  }

  isResetting.value = true;
  try {
    const id = draftProductId.value ?? props.productId;
    if (id) {
      await deleteProductDraft(id);
    }
    clearDraft();
    draftProductId.value = null;
    lastDraftSavedAt.value = null;
    form.value = createEmptyForm();
    initialFormSnapshot.value = snapshotForm();
    resetDialogVisible.value = false;

    if (isEdit.value) {
      await router.replace(localePath("/admin/produse/nou"));
    }
  } catch (error) {
    toast.add({
      severity: "error",
      summary: t("error"),
      detail: error.message,
      life: 4000,
    });
  } finally {
    isResetting.value = false;
  }
};

const resetSuperAdminForm = () => {
  if (initialFormSnapshot.value) {
    form.value = JSON.parse(initialFormSnapshot.value);
  }
};

const loadProduct = async () => {
  if (!isEdit.value && !props.changeRequest && !props.superAdminEdit) return;

  loadingProduct.value = true;
  try {
    const product = await getProduct(props.productId);

    if (props.superAdminEdit) {
      draftProductId.value = product.id;
      applyProductToForm(product);
      return;
    }

    if (props.changeRequest) {
      if (product.status !== "APPROVED") {
        toast.add({ severity: "warn", summary: t("notEditableListed"), life: 4000 });
        await router.push(localePath("/admin/produse"));
        return;
      }
      if (product.pendingProposal) {
        toast.add({ severity: "warn", summary: t("changeRequestPending"), life: 4000 });
        await router.push(localePath("/admin/produse"));
        return;
      }
    } else if (!["DRAFT", "REJECTED"].includes(product.status)) {
      toast.add({ severity: "warn", summary: t("notEditable"), life: 4000 });
      await router.push(localePath("/admin/produse"));
      return;
    }

    draftProductId.value = product.id;
    applyProductToForm(product);
  } catch (error) {
    if (draftProductId.value === props.productId) {
      draftProductId.value = null;
    }
    clearDraft();
    toast.add({
      severity: "error",
      summary: t("notFound"),
      life: 4000,
    });
    await router.push(localePath("/admin/produse/nou"));
  } finally {
    loadingProduct.value = false;
  }
};

onMounted(async () => {
  if (props.superAdminEdit) {
    await loadProduct();
    return;
  }

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
    draftProductId.value = draft.id;
    initialFormSnapshot.value = snapshotForm();
    return;
  }

  if (!isEdit.value && !props.changeRequest) {
    try {
      const activeDraft = await getActiveDraft();
      if (activeDraft?.id) {
        draftProductId.value = activeDraft.id;
        applyProductToForm(activeDraft);
        initialFormSnapshot.value = snapshotForm();
        return;
      }
    } catch (error) {
      console.error("Failed to load active product draft:", error);
    }
    initialFormSnapshot.value = snapshotForm();
    return;
  }

  await loadProduct();
});

watch(
  form,
  () => {
    if (props.changeRequest || props.superAdminEdit || loadingProduct.value || isResetting.value) return;
    debouncedPersistDraft();
  },
  { deep: true },
);

watch(
  () => form.value.price,
  (value) => {
    if (value === "" || value === "-") return;
    const num = Number(value);
    if (Number.isFinite(num) && num < 0) {
      form.value.price = "0";
    }
  },
);

watch(
  () => form.value.stockQuantity,
  (value) => {
    if (value === "" || value === "-") return;
    const num = Number(value);
    if (Number.isFinite(num) && num < 0) {
      form.value.stockQuantity = "0";
    }
  },
);

onBeforeRouteLeave(async () => {
  if (!props.changeRequest && !props.superAdminEdit) {
    await persistDraft();
  }
});
</script>

<i18n lang="json">
{
  "ro": {
    "addProduct": "Adaugă produs",
    "editProduct": "Editează produs",
    "editProductAdmin": "Editează produs (super-admin)",
    "editListedProduct": "Modifică date produs",
    "changeRequestHint": "Modificările trimise vor fi revizuite de un super-admin înainte de a apărea în magazin.",
    "superAdminEditHint": "Modificările se aplică imediat în magazin, fără validare suplimentară.",
    "submitChanges": "Trimite modificările",
    "changesSubmitted": "Modificările au fost trimise spre validare",
    "resetChangesConfirm": "Sigur vrei să resetezi modificările la valorile inițiale?",
    "notEditableListed": "Doar produsele aprobate pot fi modificate",
    "changeRequestPending": "Există deja o cerere de modificare în așteptare",
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
    "discountSection": "Reducere",
    "discountSectionHint": "Prețul din formular este prețul inițial. Reducerea se scade din acest preț — ex. 150 RON cu 90% devine 15 RON în magazin.",
    "discount": "Reducere (%)",
    "preview": "Previzualizare",
    "reset": "Resetează câmpurile",
    "resetTitle": "Resetează formularul",
    "resetConfirm": "Sigur vrei să resetezi formularul? Ciorna curentă va fi ștearsă.",
    "resetConfirmAction": "Da, resetează",
    "draftSaving": "Se salvează ciorna...",
    "draftSaved": "Ciornă salvată automat",
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
    "editProductAdmin": "Edit product (super-admin)",
    "editListedProduct": "Edit listed product",
    "changeRequestHint": "Submitted changes will be reviewed by a super-admin before appearing in the store.",
    "superAdminEditHint": "Changes are applied immediately in the store without additional review.",
    "submitChanges": "Submit changes",
    "changesSubmitted": "Changes submitted for review",
    "resetChangesConfirm": "Are you sure you want to reset your changes to the original values?",
    "notEditableListed": "Only approved products can be edited this way",
    "changeRequestPending": "A change request is already pending review",
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
    "discountSection": "Discount",
    "discountSectionHint": "The form price is the original price. The discount is taken off it — e.g. 150 RON with 90% becomes 15 RON in the store.",
    "discount": "Discount (%)",
    "preview": "Preview",
    "reset": "Reset fields",
    "resetTitle": "Reset form",
    "resetConfirm": "Are you sure you want to reset the form? The current draft will be deleted.",
    "resetConfirmAction": "Yes, reset",
    "draftSaving": "Saving draft...",
    "draftSaved": "Draft auto-saved",
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
