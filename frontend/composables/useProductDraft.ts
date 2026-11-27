export type ProductDraft = {
  id: number | null;
  title: string;
  description: string;
  price: string;
  images: string[];
  category: string;
  material: string;
  capacity: string;
  dimensions: string;
  dishwasherSafe: boolean;
  microwaveSafe: boolean;
  inStock: boolean;
  isSet: boolean;
  stockQuantity: string;
  returnPath: string;
};

const STORAGE_KEY = "product-draft";

const emptyDraft = (returnPath: string): ProductDraft => ({
  id: null,
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
  returnPath,
});

export function useProductDraft() {
  const saveDraft = (draft: ProductDraft) => {
    if (!import.meta.client) return;
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(draft));
  };

  const loadDraft = (): ProductDraft | null => {
    if (!import.meta.client) return null;
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    try {
      return JSON.parse(raw) as ProductDraft;
    } catch {
      return null;
    }
  };

  const clearDraft = () => {
    if (!import.meta.client) return;
    sessionStorage.removeItem(STORAGE_KEY);
  };

  return { saveDraft, loadDraft, clearDraft, emptyDraft };
}
