<template>
  <div class="flex flex-col">
    <label :for="id" class="text-left h-font-size-14 mb-1">
      {{ label }}
      <span v-if="required" class="text-red-500">*</span>
    </label>
    <input
      :type="type"
      :id="id"
      :name="name"
      :autocomplete="autocomplete"
      :class="[
        'h-bg-alto h-font-weight-400 h-font-size-14 rounded-md p-1 inset-shadow-sm',
        { 'border border-red-500': error },
      ]"
      :value="modelValue"
      @input="handleInput"
      @blur="$emit('blur')"
    />
    <div v-if="errorMessage" class="h-font-size-12 text-red-500 text-left mt-1">
      {{ errorMessage }}
    </div>
    <div
      v-if="helpText"
      class="h-font-size-10 text-left h-color-lunar-green mt-1"
    >
      {{ helpText }}
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  id: string;
  name: string;
  label: string;
  type?: string;
  modelValue: string;
  error?: boolean;
  errorMessage?: string;
  helpText?: string;
  required?: boolean;
  autocomplete?: string;
}>();

const emit = defineEmits<{
  (e: "update:modelValue", value: string): void;
  (e: "blur"): void;
}>();

const handleInput = (event: Event) => {
  const target = event.target as HTMLInputElement;
  emit("update:modelValue", target.value);
};
</script>
