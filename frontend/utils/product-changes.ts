import type { AdminProduct } from "~/types/product";

export type ProductChangeItem = {
  key: string;
  label: string;
  oldValue: string;
  newValue: string;
};

type FieldConfig = {
  key: keyof AdminProduct | "images";
  labelRo: string;
  labelEn: string;
  format?: (value: unknown, product: AdminProduct, locale: string) => string;
};

const FIELD_CONFIG: FieldConfig[] = [
  { key: "title", labelRo: "Titlu", labelEn: "Title" },
  { key: "description", labelRo: "Descriere", labelEn: "Description" },
  {
    key: "price",
    labelRo: "Preț",
    labelEn: "Price",
    format: (value) => `${value} RON`,
  },
  { key: "category", labelRo: "Categorie", labelEn: "Category" },
  { key: "material", labelRo: "Material", labelEn: "Material" },
  { key: "capacity", labelRo: "Capacitate", labelEn: "Capacity" },
  { key: "dimensions", labelRo: "Dimensiuni", labelEn: "Dimensions" },
  {
    key: "inStock",
    labelRo: "În stoc",
    labelEn: "In stock",
    format: (value, _product, locale) =>
      value ? (locale === "ro" ? "Da" : "Yes") : locale === "ro" ? "Nu" : "No",
  },
  {
    key: "isSet",
    labelRo: "Produs tip set",
    labelEn: "Product is a set",
    format: (value, _product, locale) =>
      value ? (locale === "ro" ? "Da" : "Yes") : locale === "ro" ? "Nu" : "No",
  },
  {
    key: "stockQuantity",
    labelRo: "Cantitate în stoc",
    labelEn: "Stock quantity",
  },
  {
    key: "dishwasherSafe",
    labelRo: "Mașină de spălat vase",
    labelEn: "Dishwasher safe",
    format: (value, _product, locale) =>
      value ? (locale === "ro" ? "Da" : "Yes") : locale === "ro" ? "Nu" : "No",
  },
  {
    key: "microwaveSafe",
    labelRo: "Cuptor cu microunde",
    labelEn: "Microwave safe",
    format: (value, _product, locale) =>
      value ? (locale === "ro" ? "Da" : "Yes") : locale === "ro" ? "Nu" : "No",
  },
  {
    key: "images",
    labelRo: "Imagini",
    labelEn: "Images",
    format: (value) => {
      const images = Array.isArray(value) ? value : [];
      return images.length
        ? `${images.length} ${images.length === 1 ? "imagine" : "imagini"}`
        : "—";
    },
  },
];

function getProductFieldValue(
  product: AdminProduct,
  key: FieldConfig["key"],
): unknown {
  if (key === "images") {
    return product.images?.length ? product.images : product.image ? [product.image] : [];
  }
  return product[key as keyof AdminProduct];
}

function formatFieldValue(
  key: FieldConfig["key"],
  value: unknown,
  product: AdminProduct,
  locale: string,
): string {
  const config = FIELD_CONFIG.find((field) => field.key === key);
  if (!config) return String(value ?? "—");
  if (config.format) {
    return config.format(value, product, locale);
  }
  if (value === null || value === undefined || value === "") return "—";
  return String(value);
}

export function getProductChangeItems(
  product: AdminProduct,
  changes: Partial<AdminProduct> & { images?: string[] },
  locale: string,
): ProductChangeItem[] {
  const items: ProductChangeItem[] = [];

  for (const field of FIELD_CONFIG) {
    const changeKey = field.key as keyof typeof changes;
    if (changes[changeKey] === undefined && field.key !== "images") {
      continue;
    }
    if (
      field.key === "images" &&
      changes.images === undefined &&
      changes.image === undefined
    ) {
      continue;
    }

    const oldRaw = getProductFieldValue(product, field.key);
    const newRaw =
      field.key === "images"
        ? (changes.images ?? (changes.image ? [changes.image] : []))
        : changes[changeKey as keyof typeof changes];

    items.push({
      key: field.key,
      label: locale === "ro" ? field.labelRo : field.labelEn,
      oldValue: formatFieldValue(field.key, oldRaw, product, locale),
      newValue: formatFieldValue(field.key, newRaw, product, locale),
    });
  }

  return items;
}

export function countProductChanges(
  product: AdminProduct,
  changes: Partial<AdminProduct> & { images?: string[] },
  locale: string,
): number {
  return getProductChangeItems(product, changes, locale).length;
}
