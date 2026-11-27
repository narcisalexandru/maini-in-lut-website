<template>
  <div class="flex flex-col gap-2">
    <label class="text-sm font-medium">{{ t("label") }}</label>
    <p class="text-xs text-gray-500 m-0">{{ t("hint") }}</p>

    <div class="flex flex-wrap gap-3">
      <div
        v-for="(url, index) in modelValue"
        :key="`${url}-${index}`"
        draggable="true"
        class="relative w-24 h-24 rounded-lg overflow-hidden border border-gray-200 bg-gray-50 cursor-grab active:cursor-grabbing"
        :class="{
          'opacity-40': dragFrom === index,
          'ring-2 ring-[#3f5134]': dragOver === index && dragFrom !== index,
        }"
        @dragstart="onDragStart(index, $event)"
        @dragover="onDragOver(index, $event)"
        @drop="onDrop(index, $event)"
        @dragend="onDragEnd"
      >
        <div
          role="button"
          tabindex="0"
          class="block w-full h-full cursor-grab"
          :aria-label="t('edit')"
          :aria-disabled="uploading"
          @click="editImage(index)"
          @keydown.enter.prevent="editImage(index)"
          @keydown.space.prevent="editImage(index)"
        >
          <img
            :src="resolveProductImageUrl(url)"
            :alt="t('imageAlt', { index: index + 1 })"
            draggable="false"
            class="w-full h-full object-cover pointer-events-none"
          />
        </div>
        <button
          type="button"
          class="absolute top-1 right-1 z-10 w-6 h-6 rounded-full bg-white/90 text-gray-700 flex items-center justify-center shadow hover:bg-white"
          :aria-label="t('remove')"
          :disabled="uploading"
          @pointerdown.stop
          @click.stop="removeImage(index)"
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

    <ProductImageCropDialog
      v-model:visible="cropOpen"
      :src="cropSrc"
      @apply="onCropApplied"
      @cancel="onCropCancelled"
    />
  </div>
</template>

<script setup>
import { useToast } from "primevue/usetoast";
import ProductImageCropDialog from "~/components/admin/ProductImageCropDialog.vue";
import { resolveProductImageUrl } from "~/utils/product-image";
import { isAcceptedProductImage } from "~/utils/optimize-product-image";

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
const cropOpen = ref(false);
const cropSrc = ref("");
const cropQueue = ref([]);
const cropReplaceIndex = ref(null);
const dragFrom = ref(null);
const dragOver = ref(null);
let ignoreNextClick = false;

const onDragStart = (index, event) => {
  if (uploading.value) {
    event.preventDefault();
    return;
  }
  dragFrom.value = index;
  event.dataTransfer.effectAllowed = "move";
  event.dataTransfer.setData("text/plain", String(index));
};

const onDragOver = (index, event) => {
  event.preventDefault();
  if (event.dataTransfer) event.dataTransfer.dropEffect = "move";
  dragOver.value = index;
};

const onDrop = (index, event) => {
  event.preventDefault();
  const from = dragFrom.value;
  dragFrom.value = null;
  dragOver.value = null;
  if (from == null || from === index) return;
  const next = [...props.modelValue];
  const [moved] = next.splice(from, 1);
  next.splice(index, 0, moved);
  emit("update:modelValue", next);
};

const onDragEnd = () => {
  ignoreNextClick = true;
  dragFrom.value = null;
  dragOver.value = null;
  window.setTimeout(() => {
    ignoreNextClick = false;
  }, 50);
};

const openFilePicker = () => {
  fileInput.value?.click();
};

const removeImage = (index) => {
  const next = [...props.modelValue];
  next.splice(index, 1);
  emit("update:modelValue", next);
};

const releaseQueue = () => {
  for (const item of cropQueue.value) {
    if (item.revoke) URL.revokeObjectURL(item.src);
  }
  cropQueue.value = [];
};

const openCurrentCrop = () => {
  const current = cropQueue.value[0];
  if (!current) {
    cropOpen.value = false;
    cropSrc.value = "";
    cropReplaceIndex.value = null;
    return;
  }
  cropReplaceIndex.value = current.replaceIndex;
  cropSrc.value = current.src;
  cropOpen.value = true;
};

const editImage = (index) => {
  if (ignoreNextClick) {
    ignoreNextClick = false;
    return;
  }
  if (uploading.value) return;
  releaseQueue();
  cropQueue.value = [
    {
      src: resolveProductImageUrl(props.modelValue[index]),
      revoke: false,
      replaceIndex: index,
    },
  ];
  openCurrentCrop();
};

const onFilesSelected = (event) => {
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

  releaseQueue();
  cropQueue.value = selectedFiles.map((file) => ({
    src: URL.createObjectURL(file),
    revoke: true,
    replaceIndex: null,
  }));
  openCurrentCrop();
};

const finishCurrent = () => {
  const [current, ...rest] = cropQueue.value;
  if (current?.revoke) URL.revokeObjectURL(current.src);
  cropQueue.value = rest;
  openCurrentCrop();
};

const onCropCancelled = () => {
  releaseQueue();
  cropOpen.value = false;
  cropSrc.value = "";
  cropReplaceIndex.value = null;
};

const onCropApplied = async (file) => {
  const replaceIndex = cropReplaceIndex.value;
  uploading.value = true;
  try {
    const { urls } = await uploadProductImages([file]);
    const uploaded = urls[0];
    if (!uploaded) return;
    const next = [...props.modelValue];
    if (replaceIndex == null) {
      next.push(uploaded);
    } else {
      next.splice(replaceIndex, 1, uploaded);
    }
    emit("update:modelValue", next);
    finishCurrent();
  } catch (error) {
    toast.add({
      severity: "error",
      summary: t("uploadError"),
      detail: error.message,
      life: 4000,
    });
    onCropCancelled();
  } finally {
    uploading.value = false;
  }
};
</script>

<i18n lang="json">
{
  "ro": {
    "label": "Imagini produs",
    "hint": "Poți adăuga până la 3 imagini. Trage miniaturile ca să le schimbi ordinea. Click pe o imagine o deschide ca să pui obiectul în mijlocul cadrului pătrat.",
    "add": "Adaugă",
    "edit": "Încadrează imaginea",
    "remove": "Șterge imaginea",
    "imageAlt": "Imagine produs {index}",
    "invalidType": "Format neacceptat",
    "invalidTypeDetail": "Folosește imagini JPG, PNG sau WebP.",
    "uploadError": "Încărcarea imaginilor a eșuat"
  },
  "en": {
    "label": "Product images",
    "hint": "You can add up to 3 images. Drag the thumbnails to change their order. Click an image to center the object in the square frame.",
    "add": "Add",
    "edit": "Frame image",
    "remove": "Remove image",
    "imageAlt": "Product image {index}",
    "invalidType": "Unsupported format",
    "invalidTypeDetail": "Use JPG, PNG, or WebP images.",
    "uploadError": "Image upload failed"
  }
}
</i18n>
