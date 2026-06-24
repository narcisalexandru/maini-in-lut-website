const MAX_DIMENSION = 1200;
const JPEG_QUALITY = 0.85;

const ACCEPTED_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/heic",
  "image/heif",
]);

export function isAcceptedProductImage(file: File): boolean {
  return ACCEPTED_TYPES.has(file.type) || /\.(jpe?g|png|webp|heic|heif)$/i.test(file.name);
}

export async function optimizeProductImage(file: File): Promise<File> {
  if (!import.meta.client) {
    return file;
  }

  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, MAX_DIMENSION / Math.max(bitmap.width, bitmap.height));
  const width = Math.round(bitmap.width * scale);
  const height = Math.round(bitmap.height * scale);

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;

  const context = canvas.getContext("2d");
  if (!context) {
    bitmap.close();
    return file;
  }

  context.drawImage(bitmap, 0, 0, width, height);
  bitmap.close();

  const blob = await new Promise<Blob | null>((resolve) => {
    canvas.toBlob(resolve, "image/jpeg", JPEG_QUALITY);
  });

  if (!blob) {
    return file;
  }

  const baseName = file.name.replace(/\.[^.]+$/, "");
  return new File([blob], `${baseName}.jpg`, { type: "image/jpeg" });
}
