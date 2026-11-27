import { Product } from '../entities/product.entity';
import { ProductProposalChanges } from '../entities/product-change-proposal.entity';

export type ProductChangeEmailItem = {
  label: string;
  before: string;
  after: string;
};

const FIELD_LABELS: Record<string, string> = {
  title: 'Titlu',
  description: 'Descriere',
  price: 'Preț',
  category: 'Categorie',
  material: 'Material',
  capacity: 'Capacitate',
  dimensions: 'Dimensiuni',
  inStock: 'În stoc',
  isSet: 'Produs tip set',
  stockQuantity: 'Cantitate în stoc',
  dishwasherSafe: 'Mașină de spălat vase',
  microwaveSafe: 'Cuptor cu microunde',
  images: 'Imagini',
};

function formatBoolean(value: unknown): string {
  return value ? 'Da' : 'Nu';
}

function getCurrentImages(product: Product): string[] {
  if (product.images?.length) {
    return product.images;
  }
  return product.image ? [product.image] : [];
}

function formatFieldValue(
  key: string,
  value: unknown,
  product?: Product,
): string {
  if (value === null || value === undefined || value === '') {
    return '—';
  }

  switch (key) {
    case 'price':
      return `${value} RON`;
    case 'inStock':
    case 'isSet':
    case 'dishwasherSafe':
    case 'microwaveSafe':
      return formatBoolean(value);
    case 'images': {
      const images = Array.isArray(value) ? value : [];
      return images.length
        ? `${images.length} ${images.length === 1 ? 'imagine' : 'imagini'}`
        : '—';
    }
    case 'description':
      return String(value).length > 200
        ? `${String(value).slice(0, 200)}…`
        : String(value);
    default:
      return String(value);
  }
}

function getCurrentValue(product: Product, key: string): unknown {
  if (key === 'images') {
    return getCurrentImages(product);
  }

  switch (key) {
    case 'title':
      return product.title;
    case 'description':
      return product.description;
    case 'price':
      return product.price;
    case 'category':
      return product.category;
    case 'material':
      return product.material;
    case 'capacity':
      return product.capacity;
    case 'dimensions':
      return product.dimensions;
    case 'inStock':
      return product.inStock;
    case 'isSet':
      return product.isSet;
    case 'stockQuantity':
      return product.stockQuantity;
    case 'dishwasherSafe':
      return product.dishwasherSafe;
    case 'microwaveSafe':
      return product.microwaveSafe;
    case 'discount':
      return product.discount;
    case 'priceBeforeDiscount':
      return product.priceBeforeDiscount;
    default:
      return undefined;
  }
}

function getProposedValue(
  changes: ProductProposalChanges,
  key: string,
): unknown {
  if (key === 'images') {
    if (changes.images !== undefined) {
      return changes.images;
    }
    if (changes.image !== undefined) {
      return [changes.image];
    }
    return undefined;
  }
  return changes[key as keyof ProductProposalChanges];
}

export function buildProductChangeEmailItems(
  product: Product,
  changes: ProductProposalChanges,
): ProductChangeEmailItem[] {
  const items: ProductChangeEmailItem[] = [];
  const keys = new Set<string>(Object.keys(changes));

  if (changes.image !== undefined && changes.images === undefined) {
    keys.add('images');
  }

  for (const key of keys) {
    if (!FIELD_LABELS[key]) {
      continue;
    }

    const proposed = getProposedValue(changes, key);
    if (proposed === undefined) {
      continue;
    }

    items.push({
      label: FIELD_LABELS[key],
      before: formatFieldValue(key, getCurrentValue(product, key), product),
      after: formatFieldValue(key, proposed, product),
    });
  }

  return items;
}
