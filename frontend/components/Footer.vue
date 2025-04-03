<template>
  <div class="bg-primary-color text-secondary-color py-4">
    <div class="container mx-auto px-4">
      <p class="text-center">
        &copy; {{ new Date().getFullYear() }} Maini in lut. All rights reserved.
      </p>
    </div>
  </div>
</template>
<script setup>
const { t } = useI18n({
  useScope: "local",
});
</script>
