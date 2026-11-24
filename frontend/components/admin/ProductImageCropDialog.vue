<template>
  <Dialog
    v-model:visible="open"
    modal
    :header="t('title')"
    :style="{ width: '26rem' }"
    :closable="!exporting"
    :dismissable-mask="!exporting"
    @hide="onHide"
  >
    <p class="text-sm text-gray-600 m-0 mb-3">{{ t("hint") }}</p>
    <div
      class="crop-frame"
      @pointerdown="onPointerDown"
      @pointermove="onPointerMove"
      @pointerup="onPointerUp"
      @pointercancel="onPointerUp"
    >
      <img
        v-if="ready"
        :src="displaySrc"
        alt=""
        class="crop-frame__image"
        draggable="false"
        :style="imageStyle"
      />
      <div v-else class="crop-frame__loading">
        <i class="ph ph-spinner animate-spin text-2xl"></i>
      </div>
      <span class="crop-frame__guide" aria-hidden="true"></span>
    </div>
    <label class="mt-4 block text-sm text-gray-700">
      {{ t("zoom") }}
      <input
        class="mt-1 w-full"
        type="range"
        min="1"
        max="3"
        step="0.01"
        :value="zoom"
        :disabled="!ready || exporting"
        @input="onZoomInput"
      />
    </label>
    <template #footer>
      <Button
        severity="secondary"
        :label="t('cancel')"
        :disabled="exporting"
        @click="open = false"
      />
      <Button
        :label="t('apply')"
        :loading="exporting"
        :disabled="!ready"
        @click="applyCrop"
      />
    </template>
  </Dialog>
</template>

<script setup lang="ts">
import Button from "primevue/button";
import Dialog from "primevue/dialog";

const FRAME = 320;
const OUTPUT = 1200;

const props = defineProps<{
  visible: boolean;
  src: string;
}>();

const emit = defineEmits<{
  "update:visible": [value: boolean];
  apply: [file: File];
  cancel: [];
}>();

const { t } = useI18n({ useScope: "local" });

const open = computed({
  get: () => props.visible,
  set: (value: boolean) => emit("update:visible", value),
});

const ready = ref(false);
const exporting = ref(false);
const applied = ref(false);
const zoom = ref(1);
const offsetX = ref(0);
const offsetY = ref(0);
const naturalWidth = ref(0);
const naturalHeight = ref(0);
const displaySrc = ref("");

let sourceImage: HTMLImageElement | null = null;
let objectUrl = "";
let dragging = false;
let dragStartX = 0;
let dragStartY = 0;
let originX = 0;
let originY = 0;
let zoomBeforeChange = 1;

const coverScale = computed(() => {
  if (!naturalWidth.value || !naturalHeight.value) return 1;
  return Math.max(FRAME / naturalWidth.value, FRAME / naturalHeight.value);
});

const displayScale = computed(() => coverScale.value * zoom.value);

const imageStyle = computed(() => ({
  width: `${naturalWidth.value * displayScale.value}px`,
  height: `${naturalHeight.value * displayScale.value}px`,
  transform: `translate(${offsetX.value}px, ${offsetY.value}px)`,
}));

function clampOffset(x: number, y: number, scale = displayScale.value) {
  const width = naturalWidth.value * scale;
  const height = naturalHeight.value * scale;
  return {
    x: Math.min(0, Math.max(FRAME - width, x)),
    y: Math.min(0, Math.max(FRAME - height, y)),
  };
}

function centerImage() {
  const placed = clampOffset(
    (FRAME - naturalWidth.value * displayScale.value) / 2,
    (FRAME - naturalHeight.value * displayScale.value) / 2,
  );
  offsetX.value = placed.x;
  offsetY.value = placed.y;
}

function loadImage(url: string, crossOrigin: boolean) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image();
    if (crossOrigin) image.crossOrigin = "anonymous";
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("image"));
    image.src = url;
  });
}

async function loadSource(src: string) {
  ready.value = false;
  sourceImage = null;
  if (objectUrl) {
    URL.revokeObjectURL(objectUrl);
    objectUrl = "";
  }
  if (!src) return;

  let image: HTMLImageElement;
  try {
    image = await loadImage(src, src.startsWith("http"));
    displaySrc.value = src;
  } catch {
    const response = await fetch(src);
    if (!response.ok) throw new Error("image");
    const blob = await response.blob();
    objectUrl = URL.createObjectURL(blob);
    image = await loadImage(objectUrl, false);
    displaySrc.value = objectUrl;
  }

  sourceImage = image;
  naturalWidth.value = image.naturalWidth;
  naturalHeight.value = image.naturalHeight;
  zoom.value = 1;
  zoomBeforeChange = 1;
  centerImage();
  ready.value = true;
}

function onZoomInput(event: Event) {
  const nextZoom = Number((event.target as HTMLInputElement).value);
  if (!Number.isFinite(nextZoom)) return;
  const previousScale = coverScale.value * zoomBeforeChange;
  zoom.value = nextZoom;
  const nextScale = displayScale.value;
  const centerX = (FRAME / 2 - offsetX.value) / previousScale;
  const centerY = (FRAME / 2 - offsetY.value) / previousScale;
  const placed = clampOffset(
    FRAME / 2 - centerX * nextScale,
    FRAME / 2 - centerY * nextScale,
    nextScale,
  );
  offsetX.value = placed.x;
  offsetY.value = placed.y;
  zoomBeforeChange = zoom.value;
}

function onPointerDown(event: PointerEvent) {
  if (!ready.value || exporting.value) return;
  const frame = event.currentTarget as HTMLElement;
  dragging = true;
  dragStartX = event.clientX;
  dragStartY = event.clientY;
  originX = offsetX.value;
  originY = offsetY.value;
  frame.setPointerCapture(event.pointerId);
}

function onPointerMove(event: PointerEvent) {
  if (!dragging) return;
  const placed = clampOffset(
    originX + event.clientX - dragStartX,
    originY + event.clientY - dragStartY,
  );
  offsetX.value = placed.x;
  offsetY.value = placed.y;
}

function onPointerUp() {
  dragging = false;
}

async function applyCrop() {
  if (!sourceImage || exporting.value) return;
  exporting.value = true;
  try {
    const canvas = document.createElement("canvas");
    canvas.width = OUTPUT;
    canvas.height = OUTPUT;
    const context = canvas.getContext("2d");
    if (!context) throw new Error("canvas");

    const sourceSize = FRAME / displayScale.value;
    const sourceX = -offsetX.value / displayScale.value;
    const sourceY = -offsetY.value / displayScale.value;
    context.drawImage(
      sourceImage,
      sourceX,
      sourceY,
      sourceSize,
      sourceSize,
      0,
      0,
      OUTPUT,
      OUTPUT,
    );

    const blob = await new Promise<Blob | null>((resolve) => {
      canvas.toBlob(resolve, "image/jpeg", 0.9);
    });
    if (!blob) throw new Error("canvas");

    applied.value = true;
    emit(
      "apply",
      new File([blob], `product-${Date.now()}.jpg`, { type: "image/jpeg" }),
    );
    open.value = false;
  } finally {
    exporting.value = false;
  }
}

function onHide() {
  ready.value = false;
  if (!applied.value) emit("cancel");
  applied.value = false;
}

watch(
  () => [props.visible, props.src] as const,
  ([visible, src]) => {
    if (visible && src) {
      applied.value = false;
      void loadSource(src).catch(() => {
        ready.value = false;
      });
    }
  },
  { immediate: true },
);

onBeforeUnmount(() => {
  if (objectUrl) URL.revokeObjectURL(objectUrl);
});
</script>

<style scoped>
.crop-frame {
  position: relative;
  width: 320px;
  height: 320px;
  margin: 0 auto;
  overflow: hidden;
  border-radius: 0.75rem;
  background: #f4f1ee;
  cursor: grab;
  touch-action: none;
}

.crop-frame:active {
  cursor: grabbing;
}

.crop-frame__image {
  position: absolute;
  top: 0;
  left: 0;
  max-width: none;
  user-select: none;
  pointer-events: none;
}

.crop-frame__loading {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #6f825d;
}

.crop-frame__guide {
  position: absolute;
  inset: 0;
  pointer-events: none;
  background:
    linear-gradient(#ffffff55, #ffffff55) center / 1px 100% no-repeat,
    linear-gradient(#ffffff55, #ffffff55) center / 100% 1px no-repeat;
}
</style>

<i18n lang="json">
{
  "ro": {
    "title": "Încadrează fotografia",
    "hint": "Cadrul este pătrat. Trage fotografia până obiectul stă în mijloc.",
    "zoom": "Mărește",
    "cancel": "Anulează",
    "apply": "Folosește fotografia"
  },
  "en": {
    "title": "Frame the photo",
    "hint": "The frame is square. Drag the photo until the object sits in the center.",
    "zoom": "Zoom",
    "cancel": "Cancel",
    "apply": "Use photo"
  }
}
</i18n>
