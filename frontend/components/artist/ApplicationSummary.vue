<template>
  <dl class="grid gap-3 text-sm border-t border-gray-100 pt-4">
    <div>
      <dt class="font-medium h-color-lunar-green">{{ t("companyCui") }}</dt>
      <dd>{{ application.companyCui || "—" }}</dd>
    </div>
    <div>
      <dt class="font-medium h-color-lunar-green">{{ t("companyLegalName") }}</dt>
      <dd>{{ application.companyLegalName || "—" }}</dd>
    </div>
    <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
      <div>
        <dt class="font-medium h-color-lunar-green">{{ t("contactFirstName") }}</dt>
        <dd>{{ application.contactFirstName || "—" }}</dd>
      </div>
      <div>
        <dt class="font-medium h-color-lunar-green">{{ t("contactLastName") }}</dt>
        <dd>{{ application.contactLastName || "—" }}</dd>
      </div>
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
    "companyCui": "CUI firmă",
    "companyLegalName": "Denumire legală firmă",
    "contactFirstName": "Prenume persoană de contact",
    "contactLastName": "Nume persoană de contact",
    "contactEmail": "Email contact",
    "contactPhone": "Telefon contact",
    "portfolioUrl": "Portofoliu"
  },
  "en": {
    "companyCui": "Company VAT ID",
    "companyLegalName": "Legal company name",
    "contactFirstName": "Contact first name",
    "contactLastName": "Contact last name",
    "contactEmail": "Contact email",
    "contactPhone": "Contact phone",
    "portfolioUrl": "Portfolio"
  }
}
</i18n>
