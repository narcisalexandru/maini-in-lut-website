<template>
  <span v-if="label" class="user-role-badge" :class="`user-role-badge--${variant}`">
    {{ label }}
  </span>
</template>

<script setup>
const props = defineProps({
  variant: {
    type: String,
    default: "profile",
    validator: (value) => ["profile", "admin"].includes(value),
  },
});

const { t } = useI18n({ useScope: "local" });
const { userRole } = useAuth();

const label = computed(() => {
  if (props.variant === "admin") {
    if (userRole.value === "SUPER_ADMIN") {
      return t("administrator");
    }
    if (userRole.value === "ARTIST") {
      return t("artist");
    }
    return "";
  }

  if (userRole.value === "SUPER_ADMIN") {
    return t("administrator");
  }
  if (userRole.value === "ARTIST") {
    return t("artist");
  }
  if (userRole.value === "CLIENT") {
    return t("client");
  }

  return "";
});
</script>

<style scoped>
.user-role-badge {
  display: inline-flex;
  align-items: center;
  padding: 0.2rem 0.65rem;
  border-radius: 9999px;
  font-size: 0.75rem;
  font-weight: 600;
  letter-spacing: 0.02em;
  text-transform: none;
}

.user-role-badge--profile {
  color: #144111;
  background: #eef2e6;
  border: 1px solid #c5d4b8;
}

.user-role-badge--admin {
  color: #144111;
  background: rgba(255, 249, 245, 0.95);
  border: 1px solid #8a9772;
}
</style>

<i18n lang="json">
{
  "ro": {
    "administrator": "Administrator",
    "artist": "Artist",
    "client": "Client"
  },
  "en": {
    "administrator": "Administrator",
    "artist": "Artist",
    "client": "Client"
  }
}
</i18n>
