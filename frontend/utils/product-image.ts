import { getApiBaseUrl } from "./api-base";

export function resolveProductImageUrl(src: string | null | undefined): string {
  if (!src) return "";
  if (src.startsWith("http://") || src.startsWith("https://")) {
    return src;
  }
  if (src.startsWith("/uploads/")) {
    return `${getApiBaseUrl()}${src}`;
  }
  return src;
}

export function getProductPrimaryImageUrl(product: {
  image?: string | null;
  images?: string[] | null;
}): string {
  const src = product.images?.[0] ?? product.image;
  return resolveProductImageUrl(src);
}
