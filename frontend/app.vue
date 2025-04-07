<template>
  <div>
    <div v-show="isReady">
      <NuxtLayout>
        <NuxtPage />
      </NuxtLayout>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from "vue";

const isReady = ref(false);

onMounted(() => {
  requestAnimationFrame(() => {
    isReady.value = true;
  });
});
</script>
