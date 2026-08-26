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
const route = useRoute();
const localePath = useLocalePath();
const { loadUser } = useAuth();

onMounted(async () => {
  try {
    const tokenParam = route.query.token as string;
    if (!tokenParam) {
      throw new Error("No token found in URL");
    }

    const data = JSON.parse(decodeURIComponent(tokenParam));
    if (data.access_token) {
      localStorage.setItem("token", data.access_token);
      localStorage.setItem("user", JSON.stringify(data.user));
      await loadUser();
      const { mergeGuestFavorites } = useFavorites();
      const { mergeGuestCart } = useCart();
      await mergeGuestFavorites();
      await mergeGuestCart();
      await router.push(localePath("/"));
    } else {
      console.error("No access token found in response");
      await router.push(localePath("/login"));
    }
  } catch (error) {
    console.error("Failed to process Google login:", error);
    await router.push(localePath("/login"));
  }
});
</script>
