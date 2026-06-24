<template>
  <dl class="grid gap-3 text-sm border-t border-gray-100 pt-4">
    <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
      <div>
        <dt class="font-medium h-color-lunar-green">{{ t("artistFirstName") }}</dt>
        <dd>{{ application.artistFirstName || "—" }}</dd>
      </div>
      <div>
        <dt class="font-medium h-color-lunar-green">{{ t("artistLastName") }}</dt>
        <dd>{{ application.artistLastName || "—" }}</dd>
      </div>
    </div>
    <div>
      <dt class="font-medium h-color-lunar-green">{{ t("companyCui") }}</dt>
      <dd>{{ application.companyCui || "—" }}</dd>
    </div>
    <div>
      <dt class="font-medium h-color-lunar-green">{{ t("companyLegalName") }}</dt>
      <dd>{{ application.companyLegalName || "—" }}</dd>
    </div>
    <div>
      <dt class="font-medium h-color-lunar-green">{{ t("displayName") }}</dt>
      <dd>{{ application.displayName }}</dd>
    </div>
    <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
      <div>
        <dt class="font-medium h-color-lunar-green">{{ t("contactEmail") }}</dt>
        <dd>{{ application.contactEmail || "—" }}</dd>
      </div>
      <div>
        <dt class="font-medium h-color-lunar-green">{{ t("contactPhone") }}</dt>
        <dd>{{ application.contactPhone || "—" }}</dd>
      </div>
    </div>
    <div v-if="application.portfolioUrl">
      <dt class="font-medium h-color-lunar-green">{{ t("portfolioUrl") }}</dt>
      <dd>
        <a
          :href="application.portfolioUrl"
          target="_blank"
          rel="noopener noreferrer"
          class="text-blue-600 hover:underline break-all"
        >
          {{ application.portfolioUrl }}
        </a>
      </dd>
    </div>
  </dl>
</template>

<script setup>
defineProps({
  application: {
    type: Object,
    required: true,
  },
});

const { t } = useI18n({ useScope: "local" });
</script>

<i18n lang="json">
{
  "ro": {
    "artistFirstName": "Prenume artist",
    "artistLastName": "Nume artist",
    "companyCui": "CUI firmă",
    "companyLegalName": "Denumire legală firmă",
    "displayName": "Nume pe site",
    "contactEmail": "Email contact",
    "contactPhone": "Telefon contact",
    "portfolioUrl": "Portofoliu"
  },
  "en": {
    "artistFirstName": "Artist first name",
    "artistLastName": "Artist last name",
    "companyCui": "Company VAT ID",
    "companyLegalName": "Legal company name",
    "displayName": "Name on site",
    "contactEmail": "Contact email",
    "contactPhone": "Contact phone",
    "portfolioUrl": "Portfolio"
  }
}
</i18n>
