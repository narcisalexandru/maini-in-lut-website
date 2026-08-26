<template>
  <div>
    <div class="flex items-center gap-3 mb-4">
      <NuxtLink
        :to="localePath('/admin/clienti')"
        class="text-sm h-color-lunar-green hover:underline flex items-center gap-1"
      >
        <i class="ph ph-arrow-left"></i>
        {{ t("back") }}
      </NuxtLink>
    </div>

    <div v-if="loading" class="flex justify-center py-12">
      <i class="ph ph-spinner text-3xl animate-spin h-color-primary"></i>
    </div>

    <div v-else-if="user" class="space-y-5">
      <div class="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
        <div>
          <h1 class="text-2xl font-bold h-color-lunar-green m-0">
            {{ user.first_name }} {{ user.last_name }}
          </h1>
          <p class="text-sm h-color-lunar-green mt-1 m-0">{{ user.email }}</p>
        </div>
        <Tag :value="user.role" severity="info" />
      </div>

      <ClientAdminNav :user-id="userId" />

      <NuxtPage />
    </div>
  </div>
</template>

<script setup>
import Tag from "primevue/tag";
import ClientAdminNav from "~/components/admin/ClientAdminNav.vue";
import { useToast } from "primevue/usetoast";

definePageMeta({
  layout: "admin",
  middleware: ["auth", "admin", "super-admin"],
});

const route = useRoute();
const localePath = useLocalePath();
const { t } = useI18n({ useScope: "local" });
const toast = useToast();
const { getUser } = useUsers();

const user = ref(null);
const loading = ref(true);
const userId = computed(() => Number(route.params.id));

const loadUser = async () => {
  loading.value = true;
  try {
    user.value = await getUser(userId.value);
  } catch (error) {
    toast.add({
      severity: "error",
      summary: t("error"),
      detail: error.message,
      life: 4000,
    });
  } finally {
    loading.value = false;
  }
};

provide("clientAdminUser", { userId, user, reloadUser: loadUser });

onMounted(loadUser);
</script>

<i18n lang="json">
{
  "ro": {
    "back": "Înapoi la listă",
    "error": "Eroare"
  },
  "en": {
    "back": "Back to list",
    "error": "Error"
  }
}
</i18n>
