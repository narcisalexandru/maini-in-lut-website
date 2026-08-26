<template>
  <div v-if="user" class="h-bg-white rounded-xl shadow p-4 md:p-6">
    <h2 class="font-semibold h-color-lunar-green text-lg m-0 mb-4">{{ t("details") }}</h2>
    <dl class="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
      <div>
        <dt class="font-medium h-color-lunar-green">{{ t("fullName") }}</dt>
        <dd>{{ user.first_name }} {{ user.last_name }}</dd>
      </div>
      <div>
        <dt class="font-medium h-color-lunar-green">{{ t("email") }}</dt>
        <dd>
          <a :href="`mailto:${user.email}`" class="text-blue-600 hover:underline">
            {{ user.email }}
          </a>
        </dd>
      </div>
      <div>
        <dt class="font-medium h-color-lunar-green">{{ t("phone") }}</dt>
        <dd>{{ user.phone || "—" }}</dd>
      </div>
      <div>
        <dt class="font-medium h-color-lunar-green">{{ t("role") }}</dt>
        <dd>{{ user.role }}</dd>
      </div>
      <div class="md:col-span-2">
        <dt class="font-medium h-color-lunar-green">{{ t("address") }}</dt>
        <dd>
          <template v-if="user.street">
            {{ user.street }}, {{ user.city }}, {{ user.county }}, {{ user.postal_code }}
          </template>
          <span v-else>—</span>
        </dd>
      </div>
    </dl>
  </div>
</template>

<script setup>
const user = inject("clientAdminUser", null)?.user;
const { t } = useI18n({ useScope: "local" });
</script>

<i18n lang="json">
{
  "ro": {
    "details": "Date client",
    "fullName": "Nume complet",
    "email": "Email",
    "phone": "Telefon",
    "role": "Rol",
    "address": "Adresă"
  },
  "en": {
    "details": "Customer details",
    "fullName": "Full name",
    "email": "Email",
    "phone": "Phone",
    "role": "Role",
    "address": "Address"
  }
}
</i18n>
