<template>
  <div class="flex flex-col gap-2">
    <label class="text-sm font-medium">{{ t("label") }}</label>
    <p class="text-xs text-gray-500 m-0">{{ t("hint") }}</p>

    <div class="flex flex-wrap gap-3">
      <div
        v-for="(url, index) in modelValue"
        :key="`${url}-${index}`"
        class="relative w-24 h-24 rounded-lg overflow-hidden border border-gray-200 bg-gray-50"
      >
        <img
          :src="resolveProductImageUrl(url)"
          :alt="t('imageAlt', { index: index + 1 })"
          class="w-full h-full object-cover"
        />
        <button
          type="button"
          class="absolute top-1 right-1 w-6 h-6 rounded-full bg-white/90 text-gray-700 flex items-center justify-center shadow hover:bg-white"
          :aria-label="t('remove')"
          :disabled="uploading"
          @click="removeImage(index)"
        >
          <i class="ph ph-x text-xs"></i>
        </button>
      </div>

      <button
        v-if="modelValue.length < maxImages"
        type="button"
        class="w-24 h-24 rounded-lg border-2 border-dashed border-gray-300 flex flex-col items-center justify-center gap-1 text-gray-500 hover:border-[#8a9772] hover:text-[#8a9772] transition-colors disabled:opacity-50"
        :disabled="uploading"
        @click="openFilePicker"
      >
        <i v-if="uploading" class="ph ph-spinner animate-spin text-xl"></i>
        <template v-else>
          <i class="ph ph-image text-xl"></i>
          <span class="text-xs">{{ t("add") }}</span>
        </template>
      </button>
    </div>

    <input
      ref="fileInput"
      type="file"
      accept="image/jpeg,image/png,image/webp,image/heic,image/heif,.jpg,.jpeg,.png,.webp,.heic,.heif"
      class="hidden"
      multiple
      @change="onFilesSelected"
    />
  </div>
</template>

<script setup>
import { useToast } from "primevue/usetoast";
import { resolveProductImageUrl } from "~/utils/product-image";
import {
  isAcceptedProductImage,
  optimizeProductImage,
} from "~/utils/optimize-product-image";

const props = defineProps({
  modelValue: {
    type: Array,
    default: () => [],
  },
  maxImages: {
    type: Number,
    default: 3,
  },
});

const emit = defineEmits(["update:modelValue"]);

const { t } = useI18n({ useScope: "local" });
const { uploadProductImages } = useArtist();
const toast = useToast();

const fileInput = ref(null);
const uploading = ref(false);

const openFilePicker = () => {
  fileInput.value?.click();
};

const removeImage = (index) => {
  const next = [...props.modelValue];
  next.splice(index, 1);
  emit("update:modelValue", next);
};

const onFilesSelected = async (event) => {
  const input = event.target;
  const files = Array.from(input.files || []);
  input.value = "";

  if (!files.length) return;

  const remainingSlots = props.maxImages - props.modelValue.length;
  if (remainingSlots <= 0) return;

  const selectedFiles = files.slice(0, remainingSlots);
  const invalidFile = selectedFiles.find((file) => !isAcceptedProductImage(file));

  if (invalidFile) {
    toast.add({
      severity: "warn",
      summary: t("invalidType"),
      detail: t("invalidTypeDetail"),
      life: 4000,
    });
    return;
  }

  uploading.value = true;
  try {
    const optimizedFiles = await Promise.all(
      selectedFiles.map((file) => optimizeProductImage(file)),
    );
    const { urls } = await uploadProductImages(optimizedFiles);
    emit("update:modelValue", [...props.modelValue, ...urls]);
  } catch (error) {
    toast.add({
      severity: "error",
      summary: t("uploadError"),
      detail: error.message,
      life: 4000,
    });
  } finally {
    uploading.value = false;
  }
};
</script>

<i18n lang="json">
{
  "ro": {
    "label": "Imagini produs",
    "hint": "Poți adăuga până la 3 imagini (JPG, PNG sau WebP). Sunt optimizate automat înainte de încărcare.",
    "add": "Adaugă",
    "remove": "Șterge imaginea",
    "imageAlt": "Imagine produs {index}",
    "invalidType": "Format neacceptat",
    "invalidTypeDetail": "Folosește imagini JPG, PNG sau WebP.",
    "uploadError": "Încărcarea imaginilor a eșuat"
  },
  "en": {
    "label": "Product images",
    "hint": "You can add up to 3 images (JPG, PNG, or WebP). They are automatically optimized before upload.",
    "add": "Add",
    "remove": "Remove image",
    "imageAlt": "Product image {index}",
    "invalidType": "Unsupported format",
    "invalidTypeDetail": "Use JPG, PNG, or WebP images.",
    "uploadError": "Image upload failed"
  }
}
</i18n>
