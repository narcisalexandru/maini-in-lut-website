<script setup lang="ts">
import { apiRequest } from "~/utils/api-request";

definePageMeta({
  layout: "empty",
});

const route = useRoute();
const router = useRouter();

const isLoading = ref(true);
const isVerified = ref(false);
const error = ref<string | null>(null);

onMounted(async () => {
  const token = typeof route.query.token === "string" ? route.query.token : "";
  if (!token) {
    error.value = "Token-ul lipsește";
    isLoading.value = false;
    return;
  }

  try {
    const response = await apiRequest("/auth/verify-email", {
      method: "POST",
      body: JSON.stringify({ token }),
    });

    if (!response.ok) {
      throw new Error("Verificarea email-ului a eșuat");
    }

    isVerified.value = true;
    await router.replace({ path: route.path, query: {} });
    setTimeout(() => {
      router.push("/login");
    }, 3000);
  } catch (e) {
    error.value =
      e instanceof Error
        ? e.message
        : "A apărut o eroare la verificarea email-ului";
  } finally {
    isLoading.value = false;
  }
});
</script>

<template>
  <div
    class="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-12 sm:px-6 lg:px-8"
  >
    <div class="w-full max-w-md space-y-8">
      <div class="text-center">
        <h2 class="mt-6 text-3xl font-bold tracking-tight text-gray-900">
          Verificare Email
        </h2>
      </div>

      <div v-if="isLoading" class="text-center">
        <p class="text-gray-600">Se verifică email-ul...</p>
      </div>

      <div v-else-if="isVerified" class="text-center">
        <div class="rounded-md bg-green-50 p-4">
          <p class="text-green-700">Email-ul a fost verificat cu succes!</p>
          <p class="mt-2 text-sm text-green-600">
            Vei fi redirecționat către pagina de autentificare în câteva
            secunde...
          </p>
        </div>
      </div>

      <div v-else-if="error" class="text-center">
        <div class="rounded-md bg-red-50 p-4">
          <p class="text-red-700">{{ error }}</p>
        </div>
        <NuxtLink
          to="/"
          class="mt-4 inline-block text-indigo-600 hover:text-indigo-500"
        >
          Înapoi la pagina principală
        </NuxtLink>
      </div>
    </div>
  </div>
</template>
