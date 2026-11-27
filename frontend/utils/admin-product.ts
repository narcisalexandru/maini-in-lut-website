import type { AdminProduct } from "~/types/product";

export function mergeProductWithProposal(product: AdminProduct): AdminProduct {
  const changes = product.pendingProposal?.changes;
  if (!changes) {
    return product;
  }

  const merged: AdminProduct = {
    ...product,
    ...changes,
  };

  if (changes.images?.length) {
    merged.images = changes.images;
    merged.image = changes.images[0];
  } else if (changes.image) {
    merged.image = changes.image;
    merged.images = [changes.image];
  }

  return merged;
}

export function getProductImageList(product: {
  image?: string | null;
  images?: string[] | null;
}): string[] {
  if (product.images?.length) {
    return product.images;
  }
  return product.image ? [product.image] : [];
}
