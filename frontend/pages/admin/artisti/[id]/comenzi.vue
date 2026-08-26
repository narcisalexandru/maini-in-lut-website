<template>
  <AdminOrdersPanel
    :fixed-artist-id="artistId"
    :filter-items-for-artist-id="artistId"
  />
</template>

<script setup>
import AdminOrdersPanel from "~/components/admin/AdminOrdersPanel.vue";
import { useArtistAdminContext } from "~/composables/useArtistAdminContext";

const { artistId } = useArtistAdminContext();
</script>
