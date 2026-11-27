<template>
  <div class="maini-ui__section products-page md:px-4">
    <div class="maini-ui__container-products">
      <div class="products-page__header">
        <h1 class="products-page__title">{{ t("produse") }}</h1>
        <div class="products-toolbar">
          <div ref="filterWrap" class="products-toolbar__filter-wrap">
            <button
              type="button"
              class="products-toolbar__filter"
              :aria-expanded="filterOpen"
              aria-haspopup="true"
              @click="filterOpen = !filterOpen"
            >
              <span>{{ t("filter") }}</span>
              <i class="ph" :class="filterOpen ? 'ph-caret-up' : 'ph-caret-down'"></i>
            </button>
            <div v-if="filterOpen" class="products-filter-menu">
              <div class="font-semibold mb-2">{{ t("categories") }}</div>
              <ul class="flex flex-col space-y-2 mb-4">
                <li class="flex items-center">
                  <Checkbox
                    binary
                    inputId="menu-all-products"
                    :modelValue="selectAll"
                    @update:modelValue="handleAllChange"
                  />
                  <label for="menu-all-products" class="ml-2">{{ t("allProducts") }}</label>
                </li>
                <li
                  v-for="cat in categories"
                  :key="'menu-cat-' + cat"
                  class="flex items-center"
                >
                  <Checkbox
                    binary
                    :inputId="'menu-cat-' + cat"
                    :modelValue="selectedCategories.includes(cat)"
                    @update:modelValue="(checked) => toggleCategory(cat, checked)"
                  />
                  <label :for="'menu-cat-' + cat" class="ml-2">{{ cat }}</label>
                </li>
              </ul>
              <div class="font-semibold mb-3">{{ t("priceRange") }}</div>
              <div class="products-filter-menu__range">
              <Slider
                v-model="priceRange"
                :min="minPrice"
                :max="maxPrice"
                :step="1"
                range
                class="mb-2"
                :pt="{
                  range: { class: 'bg-primary' },
                  handle: { class: 'border-primary' },
                }"
                @update:modelValue="handlePriceRangeChange"
              />
              </div>
              <div class="flex justify-between text-sm">
                <span>{{ priceRange[0] }} lei</span>
                <span>{{ priceRange[1] }} lei</span>
              </div>
            </div>
          </div>
          <Select
            v-model="sortBy"
            :options="sortOptions"
            optionLabel="label"
            optionValue="value"
            :placeholder="t('sort')"
            class="products-toolbar__sort"
          />
        </div>
      </div>
      <div class="flex flex-row">
        <div class="hidden md:flex flex-col w-1/5 flex-shrink-0 mr-8">
          <aside class="flex flex-col">
            <div class="mb-4 bg-white rounded-lg p-4 shadow-sm">
              <div class="font-semibold mb-2">{{ t("categories") }}</div>
              <ul class="flex flex-col space-y-2">
                <li class="flex items-center">
                  <Checkbox
                    :binary="true"
                    :inputId="'all-products'"
                    :modelValue="selectAll"
                    @update:modelValue="handleAllChange"
                  />
                  <label for="all-products" class="ml-2">{{ t("allProducts") }}</label>
                </li>

                <li
                  v-for="cat in categories"
                  :key="'cat-' + cat"
                  class="flex items-center"
                >
                  <Checkbox
                    :inputId="'cat-' + cat"
                    :binary="true"
                    :modelValue="selectedCategories.includes(cat)"
                    @update:modelValue="
                      (checked) => toggleCategory(cat, checked)
                    "
                  />
                  <label :for="'cat-' + cat" class="ml-2">{{ cat }}</label>
                </li>
              </ul>
            </div>
            <div class="mb-6 bg-white rounded-lg p-4 shadow-sm">
              <div class="font-semibold mb-2">{{ t("priceRange") }}</div>
              <Slider
                v-model="priceRange"
                :min="minPrice"
                :max="maxPrice"
                :step="1"
                range
                class="mb-2"
                :pt="{
                  range: { class: 'bg-primary' },
                  handle: { class: 'border-primary' },
                }"
                @update:modelValue="handlePriceRangeChange"
              />
              <div class="flex justify-between text-sm">
                <span>{{ priceRange[0] }} lei</span>
                <span>{{ priceRange[1] }} lei</span>
              </div>
            </div>
          </aside>
        </div>
        <div class="flex flex-col w-full">
          <div class="grid grid-cols-2 xl:grid-cols-3 gap-3 xl:gap-6">
            <ProductCard
              v-for="product in filteredProducts"
              :key="product.id"
              :product="product"
            />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount, nextTick, watch } from "vue";
import Slider from "primevue/slider";
import Checkbox from "primevue/checkbox";
import Select from "primevue/select";
import { apiRequest } from "~/utils/api-request";
import { sortInStockFirst } from "~/utils/product-stock";

const products = ref([]);
const categories = ref([]);
const selectedCategories = ref(["All"]);
const sortBy = ref("popularity");
const priceRange = ref([0, 1000]);
const minPrice = ref(0);
const maxPrice = ref(1000);
const filterOpen = ref(false);
const filterWrap = ref(null);

const { t } = useI18n({
  useScope: "local",
});

const selectAll = computed(() => selectedCategories.value.includes("All"));

const sortOptions = computed(() => [
  { label: t("sortPopularity"), value: "popularity" },
  { label: t("sortNewest"), value: "newest" },
  { label: t("sortPriceAsc"), value: "price-asc" },
  { label: t("sortPriceDesc"), value: "price-desc" },
  { label: t("sortDiscount"), value: "discount" },
]);

defineI18nRoute({
  paths: {
    ro: "/produse",
    en: "/products",
  },
});

onMounted(async () => {
  document.addEventListener("click", closeFilterOnOutsideClick);
  try {
    const response = await apiRequest("/products");
    const data = await response.json();
    products.value = data;
    categories.value = [...new Set(data.map((p) => p.category))];
    const prices = data.map((p) => p.price);
    minPrice.value = Math.min(...prices);
    maxPrice.value = Math.max(...prices);
    priceRange.value = [minPrice.value, maxPrice.value];
  } catch (error) {
    console.error("Error fetching products:", error);
  }
});

function closeFilterOnOutsideClick(event) {
  if (!filterOpen.value) return;
  if (filterWrap.value?.contains(event.target)) return;
  filterOpen.value = false;
}

onBeforeUnmount(() => {
  document.removeEventListener("click", closeFilterOnOutsideClick);
});

const filteredProducts = computed(() => {
  let filtered = products.value;
  if (!selectedCategories.value.includes("All")) {
    filtered = filtered.filter((p) =>
      selectedCategories.value.includes(p.category),
    );
  }
  filtered = filtered.filter(
    (p) => p.price >= priceRange.value[0] && p.price <= priceRange.value[1],
  );
  switch (sortBy.value) {
    case "popularity":
      filtered = [...filtered].sort((a, b) => b.popularity - a.popularity);
      break;
    case "newest":
      filtered = [...filtered].sort(
        (a, b) => new Date(b.datePublished) - new Date(a.datePublished),
      );
      break;
    case "price-asc":
      filtered = [...filtered].sort((a, b) => a.price - b.price);
      break;
    case "price-desc":
      filtered = [...filtered].sort((a, b) => b.price - a.price);
      break;
    case "discount":
      filtered = [...filtered].sort((a, b) => b.discount - a.discount);
      break;
  }
  return sortInStockFirst(filtered);
});

function handleAllChange(checked) {
  console.log("All checkbox changed to:", checked);
  if (checked) {
    selectedCategories.value = ["All"];
  } else {
    if (categories.value.includes("Cani")) {
      selectedCategories.value = ["Cani"];
    } else {
      selectedCategories.value =
        categories.value.length > 0 ? [categories.value[0]] : [];
    }

    nextTick(() => {
      console.log(
        "Selected categories after unchecking All:",
        selectedCategories.value,
      );
    });
  }
}

function toggleCategory(cat, checked) {
  console.log("Category toggled:", cat, checked);

  if (selectedCategories.value.includes("All")) {
    selectedCategories.value = selectedCategories.value.filter(
      (c) => c !== "All",
    );
  }

  if (checked) {
    selectedCategories.value.push(cat);
  } else {
    selectedCategories.value = selectedCategories.value.filter(
      (c) => c !== cat,
    );
  }

  if (selectedCategories.value.length === 0) {
    selectedCategories.value = ["All"];
  }
}

const handlePriceRangeChange = (newValue) => {
  const [min, max] = newValue;

  if (min > max) {
    priceRange.value = [max, max];
    return;
  }

  if (max < min) {
    priceRange.value = [min, min];
    return;
  }

  priceRange.value = [min, max];
};
</script>

<style scoped>
.products-page__header {
  margin-bottom: 0.75rem;
}

.products-page__title {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}

.products-toolbar {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.5rem;
  align-items: stretch;
}

.products-toolbar__filter-wrap {
  position: relative;
  min-width: 0;
}

.products-filter-menu {
  position: absolute;
  top: calc(100% + 0.35rem);
  left: 0;
  z-index: 40;
  width: 17.5rem;
  max-width: calc(100vw - 1.5rem);
  padding: 0.9rem 1rem 1rem;
  border: 1px solid #e2e8f0;
  border-radius: 0.75rem;
  background: #fff;
  box-shadow: 0 12px 28px rgba(15, 23, 42, 0.14);
}

.products-filter-menu__range {
  padding-inline: 0.7rem;
}

.products-toolbar__filter,
.products-toolbar :deep(.p-select) {
  height: 2.75rem;
  min-height: 2.75rem;
  border: 1px solid #cbd5e1;
  border-radius: 0.625rem;
  background: #fff;
  color: #334155;
  box-shadow: none;
}

.products-toolbar__filter {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem;
  width: 100%;
  padding: 0 0.85rem;
  font-size: 0.875rem;
  font-weight: 500;
  line-height: 1;
}

.products-toolbar__filter i {
  font-size: 0.9rem;
}

.products-toolbar :deep(.p-select) {
  width: 100%;
  align-items: center;
  border: 1px solid #cbd5e1 !important;
  border-radius: 0.625rem !important;
  background: #fff !important;
  box-shadow: none !important;
}

.products-toolbar :deep(.p-select-label) {
  display: flex;
  align-items: center;
  padding-block: 0;
  font-size: 0.875rem;
  color: #334155;
}

.products-toolbar :deep(.p-select-dropdown) {
  width: 2rem;
  color: #334155;
}

@media (max-width: 767px) {
  .products-page.maini-ui__section {
    padding-top: 0.75rem;
  }

  .products-page :deep(.maini-ui__container-products) {
    padding-left: 0.75rem;
    padding-right: 0.75rem;
  }
}

@media (min-width: 768px) {
  .products-page__header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 1rem;
    margin-bottom: 1rem;
  }

  .products-page__title {
    position: static;
    width: auto;
    height: auto;
    margin: 0;
    overflow: visible;
    clip: auto;
    white-space: normal;
    font-size: 1.5rem;
    font-weight: 700;
    line-height: 1.2;
  }

  .products-toolbar {
    display: flex;
    justify-content: flex-end;
    width: auto;
    gap: 0.5rem;
    margin-left: auto;
  }

  .products-toolbar__filter-wrap {
    display: none;
  }

  .products-toolbar :deep(.p-select) {
    width: 11.5rem;
  }
}
</style>

<i18n lang="json">
{
  "en": {
    "produse": "Products",
    "filter": "Filter",
    "categories": "Categories",
    "allProducts": "All products",
    "priceRange": "Price range",
    "sort": "Sort",
    "sortPopularity": "Most popular",
    "sortNewest": "Newest",
    "sortPriceAsc": "Price: low to high",
    "sortPriceDesc": "Price: high to low",
    "sortDiscount": "Discount"
  },
  "ro": {
    "produse": "Produse",
    "filter": "Filtrează",
    "categories": "Categorii",
    "allProducts": "Toate produsele",
    "priceRange": "Interval de preț",
    "sort": "Ordonează",
    "sortPopularity": "Cele mai populare",
    "sortNewest": "Cele mai noi",
    "sortPriceAsc": "Preț crescător",
    "sortPriceDesc": "Preț descrescător",
    "sortDiscount": "Discount"
  }
}
</i18n>
