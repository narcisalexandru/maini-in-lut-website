<template>
  <div class="min-h-screen flex items-center justify-center">
    <div class="text-center">
      <div
        class="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"
      ></div>
      <p class="mt-4 text-gray-600">Processing login...</p>
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({
  layout: "empty",
  ssr: false,
});

const router = useRouter();
const localePath = useLocalePath();
const { loadUser, isAuthenticated } = useAuth();

onMounted(async () => {
  try {
    await loadUser();
    if (!isAuthenticated.value) {
      await router.push(localePath("/login"));
      return;
    }
    const { mergeGuestFavorites } = useFavorites();
    const { mergeGuestCart } = useCart();
    await mergeGuestFavorites();
    await mergeGuestCart();
    await router.push(localePath("/"));
  } catch (error) {
    console.error("Failed to process Google login:", error);
    await router.push(localePath("/login"));
  }
});
</script>
