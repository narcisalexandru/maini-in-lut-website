function uploadPath(src: string): string | null {
  if (src.startsWith("/uploads/")) {
    return src;
  }
  try {
    const pathname = new URL(src).pathname;
    if (pathname.startsWith("/uploads/")) {
      return pathname;
    }
  } catch {
    return null;
  }
  return null;
}

export function resolveProductImageUrl(src: string | null | undefined): string {
  if (!src) return "";
  const path = uploadPath(src);
  if (path) {
    return `/api${path}`;
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
