<template>
  <Dialog
    :visible="showModal"
    position="bottom"
    @update:visible="(val) => emit('update:showModal', val)"
    modal
    draggable="false"
    class="w-full !m-0 !rounded-none"
  >
    <template #header>
      <h3 class="text-xl font-semibold">Selectează categorii</h3>
    </template>
    <div class="flex flex-col space-y-4">
      <div class="mb-4">
        <div class="font-semibold mb-2">Categories</div>
        <ul class="flex flex-col space-y-2">
          <li class="flex items-center">
            <Checkbox
              :binary="true"
              :inputId="'modal-all-products'"
              :modelValue="selectAll"
              @update:modelValue="handleAllChange"
            />
            <label for="modal-all-products" class="ml-2">All Products</label>
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
            <label :for="'modal-cat-' + cat" class="ml-2">{{ cat }}</label>
          </li>
        </ul>
      </div>
    </div>
  </Dialog>
</template>

<script setup>
import { ref, computed } from "vue";
import Dialog from "primevue/dialog";
import Checkbox from "primevue/checkbox";

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
});

const emit = defineEmits(["update:showModal", "update:selectedCategories"]);

const selectAll = computed(() => props.selectedCategories.includes("All"));

function handleAllChange(checked) {
  if (checked) {
    emit("update:selectedCategories", ["All"]);
  } else {
    if (props.categories.includes("Cani")) {
      emit("update:selectedCategories", ["Cani"]);
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
</script>
