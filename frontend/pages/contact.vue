<template>
  <div class="maini-ui__section md:px-4">
    <div class="maini-ui__container-products">
      <nav class="mb-6 text-sm h-color-dusty-gray" aria-label="Breadcrumb">
        <ol class="flex flex-wrap items-center gap-1">
          <li>
            <NuxtLink :to="$localePath('/')" class="hover:h-color-primary">
              {{ t("breadcrumbHome") }}
            </NuxtLink>
          </li>
          <li aria-hidden="true"><span class="mx-1">/</span></li>
          <li>
            <span class="font-medium h-color-lunar-green">{{ t("title") }}</span>
          </li>
        </ol>
      </nav>

      <header class="mb-8 max-w-2xl">
        <h1 class="text-2xl font-bold h-color-lunar-green md:text-3xl">
          {{ t("title") }}
        </h1>
        <p class="mt-2 text-sm text-gray-600">{{ t("subtitle") }}</p>
      </header>

      <div class="grid items-start gap-8 lg:grid-cols-[minmax(0,1.4fr)_minmax(280px,0.8fr)]">
        <section class="rounded-2xl border border-[#d7e0d2] bg-white p-6 md:p-8">
          <div v-if="sent" class="py-6 text-center">
            <div
              class="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-[#e7efe2] text-[#3f5134]"
            >
              <i class="ph ph-check-circle text-4xl" aria-hidden="true"></i>
            </div>
            <h2 class="mb-2 text-xl font-bold h-color-lunar-green">{{ t("sentTitle") }}</h2>
            <p class="mx-auto max-w-md text-gray-600">{{ t("sentMessage") }}</p>
            <button
              type="button"
              class="mt-6 text-sm font-semibold uppercase h-color-primary hover:underline"
              @click="resetForm"
            >
              {{ t("sendAnother") }}
            </button>
          </div>

          <form v-else class="space-y-4" novalidate @submit.prevent="handleSubmit">
            <FormInput
              id="contact-name"
              name="name"
              :label="t('name')"
              v-model="form.name"
              autocomplete="name"
              required
              :error="Boolean(errors.name)"
              :error-message="errors.name"
              @blur="validateField('name')"
            />
            <div class="flex flex-col">
              <label for="contact-subject" class="mb-1 text-left h-font-size-14">
                {{ t("subject") }}
                <span class="text-red-500">*</span>
              </label>
              <Select
                v-model="form.subject"
                inputId="contact-subject"
                :options="subjectOptions"
                optionLabel="label"
                optionValue="value"
                :placeholder="t('subjectPlaceholder')"
                class="contact-subject w-full"
                :class="{ 'contact-subject--invalid': errors.subject }"
                @change="validateField('subject')"
              />
              <p v-if="errors.subject" class="mt-1 text-left h-font-size-12 text-red-500">
                {{ errors.subject }}
              </p>
            </div>
            <div class="grid gap-4 md:grid-cols-2">
              <FormInput
                id="contact-email"
                name="email"
                type="email"
                :label="t('email')"
                v-model="form.email"
                autocomplete="email"
                required
                :error="Boolean(errors.email)"
                :error-message="errors.email"
                @blur="validateField('email')"
              />
              <FormInput
                id="contact-phone"
                name="phone"
                type="tel"
                :label="t('phone')"
                v-model="form.phone"
                autocomplete="tel"
                :error="Boolean(errors.phone)"
                :error-message="errors.phone"
                @blur="validateField('phone')"
              />
            </div>
            <div class="flex flex-col">
              <label for="contact-message" class="mb-1 text-left h-font-size-14">
                {{ t("message") }}
                <span class="text-red-500">*</span>
              </label>
              <textarea
                id="contact-message"
                v-model="form.message"
                name="message"
                rows="6"
                required
                class="h-bg-alto h-font-weight-400 h-font-size-14 rounded-md p-2 inset-shadow-sm"
                :class="{ 'border border-red-500': errors.message }"
                @blur="validateField('message')"
              />
              <p v-if="errors.message" class="mt-1 text-left h-font-size-12 text-red-500">
                {{ errors.message }}
              </p>
            </div>

            <div class="absolute -left-[9999px] h-0 w-0 overflow-hidden" aria-hidden="true">
              <label for="contact-website">Website</label>
              <input
                id="contact-website"
                v-model="form.website"
                type="text"
                name="website"
                tabindex="-1"
                autocomplete="off"
              />
            </div>

            <p v-if="submitError" class="text-sm text-red-600" role="alert">
              {{ submitError }}
            </p>

            <Button
              type="submit"
              class="maini-ui-button__primary"
              :label="t('submit')"
              :loading="submitting"
            />
            <p class="text-xs text-gray-500">
              {{ t("privacyBefore") }}
              <NuxtLink
                :to="$localePath({ name: 'privacy-policy' })"
                class="underline hover:h-color-primary"
              >{{ t("privacyLink") }}</NuxtLink>.
            </p>
          </form>
        </section>

        <aside class="rounded-2xl border border-[#d7e0d2] bg-white p-6">
          <h2 class="mb-4 text-lg font-bold h-color-lunar-green">{{ t("detailsTitle") }}</h2>
          <ul class="space-y-3 text-sm text-gray-700">
            <li class="flex items-start gap-3">
              <i class="ph ph-buildings mt-0.5 text-lg h-color-primary" aria-hidden="true"></i>
              <span>{{ COMPANY.legalName }}</span>
            </li>
            <li class="flex items-start gap-3">
              <i class="ph ph-identification-card mt-0.5 text-lg h-color-primary" aria-hidden="true"></i>
              <span>{{ t("companyIds", { cui: COMPANY.cui, tradeRegister: COMPANY.tradeRegister }) }}</span>
            </li>
            <li class="flex items-start gap-3">
              <i class="ph ph-map-pin mt-0.5 text-lg h-color-primary" aria-hidden="true"></i>
              <a
                :href="mapsUrl"
                class="hover:underline h-color-lunar-green"
                target="_blank"
                rel="noopener noreferrer"
              >
                {{ companyAddress }}
              </a>
            </li>
            <li class="flex items-start gap-3">
              <i class="ph ph-envelope-simple mt-0.5 text-lg h-color-primary" aria-hidden="true"></i>
              <a :href="`mailto:${COMPANY.email}`" class="hover:underline h-color-lunar-green">
                {{ COMPANY.email }}
              </a>
            </li>
            <li class="flex items-start gap-3">
              <i class="ph ph-phone mt-0.5 text-lg h-color-primary" aria-hidden="true"></i>
              <a :href="`tel:${COMPANY.phoneTel}`" class="hover:underline h-color-lunar-green">
                {{ COMPANY.phone }}
              </a>
            </li>
          </ul>

          <div class="mt-6 flex gap-3">
            <a
              v-for="social in SOCIAL_LINKS"
              :key="social.label"
              :href="social.href"
              :aria-label="social.label"
              class="flex h-10 w-10 items-center justify-center rounded-full bg-[#e7efe2] text-[#3f5134] transition-colors hover:bg-[#d7e0d2]"
              target="_blank"
              rel="noopener noreferrer"
            >
              <i :class="['ph', social.icon]" aria-hidden="true"></i>
            </a>
          </div>
        </aside>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import Button from "primevue/button";
import Select from "primevue/select";
import FormInput from "~/components/FormInput.vue";
import {
  COMPANY,
  COMPANY_ADDRESS_EN,
  COMPANY_ADDRESS_RO,
  SOCIAL_LINKS,
} from "~/constants/company";
import { apiRequest } from "~/utils/api-request";
import { isRomanianPhone } from "~/utils/phone";

defineI18nRoute({
  paths: {
    ro: "/contact",
    en: "/contact",
  },
});

const { t, locale } = useI18n({
  useScope: "local",
});

useSeoMeta({
  title: () => t("title"),
  description: () => t("subtitle"),
});

const companyAddress = computed(() =>
  locale.value === "en" ? COMPANY_ADDRESS_EN : COMPANY_ADDRESS_RO,
);

const mapsUrl = computed(
  () =>
    `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(COMPANY_ADDRESS_RO)}`,
);

type ContactSubject = "order" | "product" | "collaboration" | "other";
type FieldName = "name" | "subject" | "email" | "phone" | "message";

const subjectOptions = computed(() => [
  { value: "order" as const, label: t("subjectOrder") },
  { value: "product" as const, label: t("subjectProduct") },
  { value: "collaboration" as const, label: t("subjectCollaboration") },
  { value: "other" as const, label: t("subjectOther") },
]);

const form = reactive({
  name: "",
  subject: "" as ContactSubject | "",
  email: "",
  phone: "",
  message: "",
  website: "",
});

const errors = reactive<Record<FieldName, string>>({
  name: "",
  subject: "",
  email: "",
  phone: "",
  message: "",
});

const submitting = ref(false);
const sent = ref(false);
const submitError = ref("");

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function validateField(field: FieldName): boolean {
  const value = form[field].trim();
  if (field === "name") {
    errors.name = value.length < 2 ? t("nameError") : "";
  } else if (field === "subject") {
    errors.subject = value ? "" : t("subjectError");
  } else if (field === "email") {
    errors.email = emailPattern.test(value) ? "" : t("emailError");
  } else if (field === "phone") {
    errors.phone = value && !isRomanianPhone(value) ? t("phoneError") : "";
  } else if (value.length < 10) {
    errors.message = t("messageError");
  } else {
    errors.message = "";
  }
  return !errors[field];
}

function validateForm(): boolean {
  return (["name", "subject", "email", "phone", "message"] as FieldName[]).every(validateField);
}

async function handleSubmit() {
  submitError.value = "";
  if (!validateForm()) return;

  submitting.value = true;
  try {
    const response = await apiRequest("/contact", {
      method: "POST",
      body: JSON.stringify({
        name: form.name.trim(),
        subject: form.subject,
        email: form.email.trim(),
        phone: form.phone.trim(),
        message: form.message.trim(),
        website: form.website,
      }),
    });
    if (!response.ok) {
      submitError.value = t("sendError");
      return;
    }
    sent.value = true;
  } catch {
    submitError.value = t("sendError");
  } finally {
    submitting.value = false;
  }
}

function resetForm() {
  form.name = "";
  form.subject = "";
  form.email = "";
  form.phone = "";
  form.message = "";
  form.website = "";
  errors.name = "";
  errors.subject = "";
  errors.email = "";
  errors.phone = "";
  errors.message = "";
  submitError.value = "";
  sent.value = false;
}
</script>

<style scoped>
:deep(.contact-subject.p-select) {
  width: 100%;
  min-height: 2.25rem;
  background: #e8e8e8 !important;
  border: none !important;
  border-radius: 0.375rem !important;
  box-shadow: inset 0 1px 2px rgb(0 0 0 / 0.05) !important;
}

:deep(.contact-subject--invalid.p-select) {
  border: 1px solid #ef4444 !important;
}
</style>

<i18n lang="json">
{
  "en": {
    "breadcrumbHome": "Home",
    "title": "Contact",
    "subtitle": "Write to us about an order, a product, or a collaboration. We reply by email.",
    "name": "Name",
    "subject": "Subject",
    "subjectPlaceholder": "Choose a subject",
    "subjectOrder": "Order",
    "subjectProduct": "Product",
    "subjectCollaboration": "Collaboration",
    "subjectOther": "Something else",
    "subjectError": "Choose a subject.",
    "email": "Email",
    "phone": "Phone",
    "message": "Message",
    "submit": "Send message",
    "nameError": "Enter your name.",
    "emailError": "Enter a valid email address.",
    "phoneError": "Enter a valid Romanian phone number.",
    "messageError": "The message needs at least 10 characters.",
    "sendError": "The message could not be sent. Try again, or email us directly.",
    "sentTitle": "Message sent",
    "sentMessage": "Thank you. We will reply to the email address you left.",
    "sendAnother": "Send another message",
    "privacyBefore": "We use these details only to answer you. See the",
    "privacyLink": "privacy policy",
    "detailsTitle": "Workshop details",
    "companyIds": "CUI {cui} · Reg. Com. {tradeRegister}"
  },
  "ro": {
    "breadcrumbHome": "Acasă",
    "title": "Contact",
    "subtitle": "Scrie-ne despre o comandă, un produs sau o colaborare. Răspundem pe email.",
    "name": "Nume",
    "subject": "Subiect",
    "subjectPlaceholder": "Alege subiectul",
    "subjectOrder": "Comandă",
    "subjectProduct": "Produs",
    "subjectCollaboration": "Colaborare",
    "subjectOther": "Altceva",
    "subjectError": "Alege un subiect.",
    "email": "Email",
    "phone": "Telefon",
    "message": "Mesaj",
    "submit": "Trimite mesajul",
    "nameError": "Introdu numele.",
    "emailError": "Introdu o adresă de email validă.",
    "phoneError": "Introdu un număr de telefon valid din România.",
    "messageError": "Mesajul trebuie să aibă cel puțin 10 caractere.",
    "sendError": "Mesajul nu a putut fi trimis. Încearcă din nou sau scrie-ne direct pe email.",
    "sentTitle": "Mesaj trimis",
    "sentMessage": "Mulțumim. Îți răspundem la adresa de email pe care ai lăsat-o.",
    "sendAnother": "Trimite alt mesaj",
    "privacyBefore": "Folosim aceste date doar ca să îți răspundem. Vezi",
    "privacyLink": "politica de confidențialitate",
    "detailsTitle": "Date firmă",
    "companyIds": "CUI {cui} · Reg. Com. {tradeRegister}"
  }
}
</i18n>
