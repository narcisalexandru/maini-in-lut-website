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
import "~/assets/scss/index.scss";
import "~/assets/css/main.css";

const isReady = ref(false);

onMounted(() => {
  requestAnimationFrame(() => {
    isReady.value = true;
  });
});
</script>
