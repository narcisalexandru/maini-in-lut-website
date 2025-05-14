<template>
  <div class="flex maini-ui__section mx-auto px-4 py-8">
    <div class="maini-ui__container flex-row flex">
      <div class="flex flex-col w-1/5 flex-shrink-0 mr-8 p-4">
        <h2 class="text-2xl font-bold mb-6">{{ t("produse") }}</h2>
        <aside class="flex flex-col">
          <div class="mb-6 bg-white rounded-lg p-4 shadow-sm">
            <div class="font-semibold mb-2">Categories</div>
            <ul class="flex flex-col space-y-2">
              <li class="flex items-center">
                <Checkbox
                  :binary="true"
                  :inputId="'all-products'"
                  :modelValue="selectAll"
                  @update:modelValue="handleAllChange"
                />
                <label for="all-products" class="ml-2">All Products</label>
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
                  @update:modelValue="(checked) => toggleCategory(cat, checked)"
                />
                <label :for="'cat-' + cat" class="ml-2">{{ cat }}</label>
              </li>
            </ul>
          </div>
          <div class="mb-6 bg-white rounded-lg p-4 shadow-sm">
            <div class="font-semibold mb-2">Price Range</div>
            <Slider
              v-model="priceRange"
              :min="minPrice"
              :max="maxPrice"
              :step="1"
              range
              class="mb-2"
            />
            <div class="flex justify-between text-sm">
              <span>${{ priceRange[0] }}</span>
              <span>${{ priceRange[1] }}</span>
            </div>
          </div>
        </aside>
      </div>
      <div class="flex flex-col w-full">
        <div class="flex justify-end items-center mb-4">
          <label class="mr-2 font-medium">Ordonează:</label>
          <Select
            v-model="sortBy"
            :options="sortOptions"
            optionLabel="label"
            optionValue="value"
            class="w-48"
          />
        </div>
        <div
          class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6"
        >
          <ProductCard
            v-for="product in filteredProducts"
            :key="product.id"
            :product="product"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, nextTick } from "vue";
import Dropdown from "primevue/dropdown";
import Slider from "primevue/slider";
import Checkbox from "primevue/checkbox";
import Select from "primevue/select";

const products = ref([]);
const categories = ref([]);
const selectedCategories = ref(["All"]);
const sortBy = ref("popularity");
const priceRange = ref([0, 1000]);
const minPrice = ref(0);
const maxPrice = ref(1000);

const selectAll = computed(() => selectedCategories.value.includes("All"));

const sortOptions = [
  { label: "Cele mai populare", value: "popularity" },
  { label: "Cele mai noi", value: "newest" },
  { label: "Pret crescator", value: "price-asc" },
  { label: "Pret descrescator", value: "price-desc" },
  { label: "Discount", value: "discount" },
  { label: "Nr. review-uri", value: "reviews" },
];

const { t } = useI18n({
  useScope: "local",
});

defineI18nRoute({
  paths: {
    ro: "/produse",
    en: "/products",
  },
});

onMounted(async () => {
  try {
    const response = await fetch("http://localhost:4000/products");
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

const filteredProducts = computed(() => {
  let filtered = products.value;
  if (!selectedCategories.value.includes("All")) {
    filtered = filtered.filter((p) =>
      selectedCategories.value.includes(p.category)
    );
  }
  filtered = filtered.filter(
    (p) => p.price >= priceRange.value[0] && p.price <= priceRange.value[1]
  );
  switch (sortBy.value) {
    case "popularity":
      filtered = [...filtered].sort((a, b) => b.popularity - a.popularity);
      break;
    case "newest":
      filtered = [...filtered].sort(
        (a, b) => new Date(b.datePublished) - new Date(a.datePublished)
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
    case "reviews":
      filtered = [...filtered].sort((a, b) => b.reviewsCount - a.reviewsCount);
      break;
  }
  return filtered;
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
        selectedCategories.value
      );
    });
  }
}

function toggleCategory(cat, checked) {
  console.log("Category toggled:", cat, checked);

  if (selectedCategories.value.includes("All")) {
    selectedCategories.value = selectedCategories.value.filter(
      (c) => c !== "All"
    );
  }

  if (checked) {
    selectedCategories.value.push(cat);
  } else {
    selectedCategories.value = selectedCategories.value.filter(
      (c) => c !== cat
    );
  }

  if (selectedCategories.value.length === 0) {
    selectedCategories.value = ["All"];
  }
}
</script>

<i18n lang="json">
{
  "en": {
    "produse": "Products"
  },
  "ro": {
    "produse": "Produse"
  }
}
</i18n>
