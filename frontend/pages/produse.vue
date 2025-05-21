<template>
  <div class="maini-ui__section md:px-4">
    <div class="maini-ui__container-products">
      <div
        class="flex flex-col mb-4 lg:flex-row lg:items-center lg:justify-between lg:mb-4"
      >
        <h2 class="flex text-2xl justify-start font-bold">
          {{ t("produse") }}
        </h2>
        <div class="grid grid-cols-2 md:flex md:justify-end gap-2">
          <div class="flex md:hidden">
            <button
              class="maini-ui-button flex justify-between w-full h-bg-white border-1 h-border-color-geyser h-color-pickled-bluewood"
              @click="showCategoryModal = true"
            >
              Filtrează <i class="ph ph-caret-down h-font-size-16"></i>
            </button>
          </div>
          <div class="flex">
            <Select
              v-model="sortBy"
              :options="sortOptions"
              optionLabel="label"
              optionValue="value"
              placeholder="Ordonează"
              class="text-xs w-full items-center"
            />
          </div>
        </div>
      </div>
      <div class="flex flex-row">
        <div class="hidden md:flex flex-col w-1/5 flex-shrink-0 mr-8">
          <aside class="flex flex-col">
            <div class="mb-4 bg-white rounded-lg p-4 shadow-sm">
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
                    @update:modelValue="
                      (checked) => toggleCategory(cat, checked)
                    "
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
          <div class="grid grid-cols-2 lg:grid-cols-3 gap-2 lg:gap-6">
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
  <ModalCategorySelect
    v-model:showModal="showCategoryModal"
    :categories="categories"
    :selectedCategories="selectedCategories"
    @update:selectedCategories="selectedCategories = $event"
    :numberofProducts="filteredProducts.length"
  />
</template>

<script setup>
import { ref, computed, onMounted, nextTick } from "vue";
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
const showCategoryModal = ref(false);

const selectAll = computed(() => selectedCategories.value.includes("All"));

const sortOptions = [
  { label: "Cele mai populare", value: "popularity" },
  { label: "Cele mai noi", value: "newest" },
  { label: "Pret crescator", value: "price-asc" },
  { label: "Pret descrescator", value: "price-desc" },
  { label: "Discount", value: "discount" },
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

<style scoped>
.maini-ui-button {
  font-size: 12px;
}
</style>

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
