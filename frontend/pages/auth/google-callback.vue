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
import { onMounted } from "vue";
import { useRouter, useRoute } from "vue-router";

const router = useRouter();
const route = useRoute();

definePageMeta({
  layout: "empty",
});

onMounted(() => {
  try {
    const tokenParam = route.query.token as string;
    if (!tokenParam) {
      throw new Error("No token found in URL");
    }

    const data = JSON.parse(decodeURIComponent(tokenParam));
    if (data.access_token) {
      localStorage.setItem("token", data.access_token);
      localStorage.setItem("user", JSON.stringify(data.user));
      router.push("/");
    } else {
      console.error("No access token found in response");
      router.push("/login");
    }
  } catch (error) {
    console.error("Failed to process Google login:", error);
    router.push("/login");
  }
});
</script>
