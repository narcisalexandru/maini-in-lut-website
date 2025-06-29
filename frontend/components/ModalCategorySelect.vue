<template>
  <Dialog
    :visible="showModal"
    ref="modalContent"
    position="bottom"
    @update:visible="(val) => emit('update:showModal', val)"
    @hide="emit('update:showModal', false)"
    modal
    class="w-full !m-0 !rounded-none"
  >
    <template #header>
      <h3 class="text-xl font-semibold">{{ t("select_categories") }}</h3>
    </template>
    <div class="flex flex-col space-y-4">
      <div class="mb-4">
        <div class="font-semibold mb-2">{{ t("categories") }}</div>
        <ul class="flex flex-col space-y-2">
          <li class="flex items-center">
            <Checkbox
              :binary="true"
              :inputId="'modal-all-products'"
              :modelValue="selectAll"
              @update:modelValue="handleAllChange"
            />
            <label for="modal-all-products" class="ml-2">{{
              t("allProducts")
            }}</label>
          </li>
          <li
            v-for="cat in categories"
            :key="'modal-cat-' + cat"
            class="flex items-center"
          >
            <Checkbox
              :inputId="'modal-cat-' + cat"
              :binary="true"
              :modelValue="selectedCategories.includes(cat)"
              @update:modelValue="(checked) => toggleCategory(cat, checked)"
            />
            <label :for="'modal-cat-' + cat" class="ml-2">{{
              t("category." + cat)
            }}</label>
          </li>
        </ul>
      </div>
    </div>
    <div class="flex justify-center">
      <button
        class="maini-ui-button w-full bg-white border-1 h-border-color-geyser"
        @click="emit('update:showModal', false)"
      >
        {{ t("seeProducts") }} ({{ numberofProducts }})
      </button>
    </div>
  </Dialog>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, watch } from "vue";
import Dialog from "primevue/dialog";
import Checkbox from "primevue/checkbox";
import { useI18n } from "vue-i18n";

const props = defineProps({
  showModal: {
    type: Boolean,
    required: true,
  },
  categories: {
    type: Array,
    required: true,
  },
  selectedCategories: {
    type: Array,
    required: true,
  },
  numberofProducts: {
    type: Number,
    required: true,
  },
});

const emit = defineEmits(["update:showModal", "update:selectedCategories"]);

const { t } = useI18n({ useScope: "local" });

const selectAll = computed(() => props.selectedCategories.includes("All"));

const modalContent = ref(null);

function handleAllChange(checked) {
  if (checked) {
    emit("update:selectedCategories", ["All"]);
  } else {
    if (props.categories.includes("Mugs")) {
      emit("update:selectedCategories", ["Mugs"]);
    } else {
      emit(
        "update:selectedCategories",
        props.categories.length > 0 ? [props.categories[0]] : []
      );
    }
  }
}

function toggleCategory(cat, checked) {
  let newCategories = [...props.selectedCategories];

  if (newCategories.includes("All")) {
    newCategories = newCategories.filter((c) => c !== "All");
  }

  if (checked) {
    newCategories.push(cat);
  } else {
    newCategories = newCategories.filter((c) => c !== cat);
  }

  if (newCategories.length === 0) {
    newCategories = ["All"];
  }

  emit("update:selectedCategories", newCategories);
}

function handleClickOutside(event) {
  if (props.showModal) {
    const dialogEl = document.querySelector(".p-dialog");
    if (dialogEl && !dialogEl.contains(event.target)) {
      emit("update:showModal", false);
    }
  }
}

watch(
  () => props.showModal,
  (val) => {
    if (val) {
      document.addEventListener("mousedown", handleClickOutside);
    } else {
      document.removeEventListener("mousedown", handleClickOutside);
    }
  }
);

onUnmounted(() => {
  document.removeEventListener("mousedown", handleClickOutside);
});
</script>

<i18n lang="json">
{
  "en": {
    "select_categories": "Select categories",
    "categories": "Categories",
    "allProducts": "All Products",
    "seeProducts": "See products",
    "category": {
      "Mugs": "Mugs",
      "Vases": "Vases",
      "Platters": "Platters",
      "Plates": "Plates"
    }
  },
  "ro": {
    "select_categories": "Selectează categorii",
    "categories": "Categorii",
    "allProducts": "Toate produsele",
    "seeProducts": "Vezi produse",
    "category": {
      "Mugs": "Căni",
      "Vases": "Vaze",
      "Platters": "Platouri",
      "Plates": "Farfurii"
    }
  }
}
</i18n>
