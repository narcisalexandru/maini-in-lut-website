<template>
  <div>
    <div class="flex items-center gap-3 mb-4">
      <NuxtLink
        :to="localePath('/admin/artisti')"
        class="text-sm h-color-lunar-green hover:underline flex items-center gap-1"
      >
        <i class="ph ph-arrow-left"></i>
        {{ t("back") }}
      </NuxtLink>
    </div>

    <div v-if="loading" class="flex justify-center py-12">
      <i class="ph ph-spinner text-3xl animate-spin h-color-primary"></i>
    </div>

    <div v-else-if="artist" class="space-y-5">
      <div class="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
        <div>
          <h1 class="text-2xl font-bold h-color-lunar-green m-0">{{ artist.displayName }}</h1>
          <p class="text-sm h-color-lunar-green mt-1 m-0">{{ t("slug") }}: {{ artist.slug }}</p>
        </div>
        <Tag :value="artist.status" :severity="statusSeverity" />
      </div>

      <ArtistAdminNav :artist-id="artistId" />

      <NuxtPage />
    </div>
  </div>
</template>

<script setup>
import Tag from "primevue/tag";
import ArtistAdminNav from "~/components/admin/ArtistAdminNav.vue";
import { artistAdminContextKey } from "~/composables/useArtistAdminContext";
import { useToast } from "primevue/usetoast";

definePageMeta({
  layout: "admin",
  middleware: ["auth", "admin", "super-admin"],
});

const route = useRoute();
const localePath = useLocalePath();
const { t } = useI18n({ useScope: "local" });
const toast = useToast();
const { getArtist } = useArtist();

const artist = ref(null);
const loading = ref(true);
const artistId = computed(() => Number(route.params.id));

const statusSeverity = computed(() => {
  switch (artist.value?.status) {
    case "APPROVED":
      return "success";
    case "PENDING":
      return "warn";
    case "REJECTED":
      return "danger";
    case "SUSPENDED":
      return "warn";
    default:
      return "secondary";
  }
});

const loadArtist = async () => {
  loading.value = true;
  try {
    artist.value = await getArtist(artistId.value);
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

provide(artistAdminContextKey, {
  artistId,
  artist,
  reloadArtist: loadArtist,
});

onMounted(loadArtist);
</script>

<i18n lang="json">
{
  "ro": {
    "back": "Înapoi la listă",
    "slug": "Slug",
    "error": "Eroare"
  },
  "en": {
    "back": "Back to list",
    "slug": "Slug",
    "error": "Error"
  }
}
</i18n>
