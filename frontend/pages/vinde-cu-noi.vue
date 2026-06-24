<template>
  <section class="maini-ui__section">
    <div class="maini-ui__container max-w-3xl">
      <h1 class="maini-ui__heading text-left mb-2">{{ t("title") }}</h1>
      <p class="h-color-lunar-green mb-8">{{ t("subtitle") }}</p>

      <div v-if="activeView === 'loading'" class="flex justify-center py-12">
        <i class="ph ph-spinner text-3xl animate-spin h-color-primary"></i>
      </div>

      <div
        v-else-if="activeView === 'approved'"
        class="h-bg-white rounded-xl shadow-md p-6 mb-6"
      >
        <p class="h-color-lunar-green mb-4">{{ t("approvedMessage") }}</p>
        <NuxtLink :to="$localePath('/admin')">
          <Button :label="t('goToPanel')" class="maini-ui-button__primary" />
        </NuxtLink>
      </div>

      <div
        v-else-if="activeView === 'pending'"
        class="h-bg-white rounded-xl shadow-md p-6 md:p-8 space-y-4 mb-6"
      >
        <p class="h-color-lunar-green font-medium">{{ t("pendingMessage") }}</p>
        <ApplicationSummary :application="application" />
        <p class="text-sm h-color-lunar-green">{{ t("pendingEmailHint") }}</p>
      </div>

      <div
        v-else-if="activeView === 'rejected'"
        class="h-bg-white rounded-xl shadow-md p-6 md:p-8 space-y-4 mb-6"
      >
        <p class="h-color-lunar-green font-medium">{{ t("rejectedMessage") }}</p>
        <p
          v-if="application?.rejectionReason"
          class="text-sm text-red-700 whitespace-pre-wrap"
        >
          <span class="font-medium">{{ t("rejectionReason") }}:</span>
          {{ application.rejectionReason }}
        </p>
        <ApplicationSummary :application="application" />
        <Button
          :label="t('reapply')"
          class="maini-ui-button__primary"
          @click="startReapply"
        />
      </div>

      <div
        v-else-if="activeView === 'suspended'"
        class="h-bg-white rounded-xl shadow-md p-6 md:p-8"
      >
        <p class="h-color-lunar-green">{{ t("suspendedMessage") }}</p>
      </div>

      <div
        v-else-if="activeView === 'super-admin'"
        class="h-bg-white rounded-xl shadow-md p-6 md:p-8"
      >
        <p class="h-color-lunar-green">{{ t("superAdminMessage") }}</p>
      </div>

      <form
        v-else-if="activeView === 'form'"
        class="h-bg-white rounded-xl shadow-md p-6 md:p-8 space-y-6"
        @submit.prevent="handleSubmit"
      >
        <p v-if="isReapply" class="h-color-lunar-green text-sm">
          {{ t("reapplyHint") }}
        </p>

        <div>
          <h2 class="font-semibold h-color-palm-leaf mb-3">{{ t("sectionArtist") }}</h2>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormInput
              id="artistFirstName"
              name="artistFirstName"
              :label="t('artistFirstName')"
              v-model="form.artistFirstName"
              required
            />
            <FormInput
              id="artistLastName"
              name="artistLastName"
              :label="t('artistLastName')"
              v-model="form.artistLastName"
              required
            />
          </div>
        </div>

        <div>
          <h2 class="font-semibold h-color-palm-leaf mb-3">{{ t("sectionCompany") }}</h2>
          <div class="grid grid-cols-1 md:grid-cols-[1fr_auto] gap-3 items-end">
            <FormInput
              id="companyCui"
              name="companyCui"
              :label="t('companyCui')"
              v-model="form.companyCui"
              required
              @keydown.enter.prevent="lookupCompany"
            />
            <Button
              type="button"
              :label="t('lookupCui')"
              class="maini-ui-button__primary whitespace-nowrap"
              :loading="cuiLookupLoading"
              @click="lookupCompany"
            />
          </div>
          <p v-if="cuiLookupError" class="text-sm text-red-600 mt-2">{{ cuiLookupError }}</p>
          <FormInput
            id="companyLegalName"
            name="companyLegalName"
            class="mt-4"
            :label="t('companyLegalName')"
            v-model="form.companyLegalName"
            required
          />
          <FormInput
            id="displayName"
            name="displayName"
            class="mt-4"
            :label="t('displayName')"
            :help-text="t('displayNameHint')"
            v-model="form.displayName"
            required
          />
        </div>

        <div>
          <h2 class="font-semibold h-color-palm-leaf mb-3">{{ t("sectionContact") }}</h2>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormInput
              id="contactEmail"
              name="contactEmail"
              type="email"
              :label="t('contactEmail')"
              v-model="form.contactEmail"
              required
            />
            <FormInput
              id="contactPhone"
              name="contactPhone"
              type="tel"
              :label="t('contactPhone')"
              v-model="form.contactPhone"
            />
          </div>
        </div>

        <FormInput
          id="portfolioUrl"
          name="portfolioUrl"
          :label="t('portfolioUrl')"
          v-model="form.portfolioUrl"
        />

        <div class="flex flex-wrap gap-2">
          <Button
            type="submit"
            :label="isReapply ? t('resubmit') : t('submit')"
            class="maini-ui-button__primary"
            :loading="submitting"
          />
          <Button
            v-if="isReapply"
            type="button"
            severity="secondary"
            :label="t('cancel')"
            @click="cancelReapply"
          />
        </div>
      </form>

      <div
        v-else
        class="h-bg-white rounded-xl shadow-md p-6 md:p-8 text-center"
      >
        <p class="h-color-lunar-green mb-4">{{ t("loginRequired") }}</p>
        <NuxtLink :to="loginUrl">
          <Button :label="t('loginCta')" class="maini-ui-button__primary" />
        </NuxtLink>
      </div>
    </div>
  </section>
</template>

<script setup>
import Button from "primevue/button";
import FormInput from "~/components/FormInput.vue";
import ApplicationSummary from "~/components/artist/ApplicationSummary.vue";
import { useToast } from "primevue/usetoast";

defineI18nRoute({
  paths: {
    ro: "/vinde-cu-noi",
    en: "/sell-with-us",
  },
});

definePageMeta({});

const { t } = useI18n({ useScope: "local" });
const toast = useToast();
const route = useRoute();
const { loadUser } = useAuth();
const { isAuthenticated, syncFromStorage, user } = useAuthState();
const { getMyApplication, apply } = useArtist();
const { loading: cuiLookupLoading, error: cuiLookupError, lookupByCui } =
  useCompanyLookup();

const application = ref(null);
const authReady = ref(false);
const submitting = ref(false);
const isEditing = ref(false);

const createEmptyForm = () => ({
  artistFirstName: "",
  artistLastName: "",
  companyCui: "",
  companyLegalName: "",
  displayName: "",
  contactEmail: "",
  contactPhone: "",
  portfolioUrl: "",
});

const form = ref(createEmptyForm());

const isArtist = computed(() => user.value.role === "ARTIST");
const isSuperAdmin = computed(() => user.value.role === "SUPER_ADMIN");

const isReapply = computed(
  () => application.value?.status === "REJECTED" && isEditing.value,
);

const hasAuth = computed(() => {
  if (isAuthenticated.value) {
    return true;
  }
  if (!import.meta.client) {
    return false;
  }
  return Boolean(
    localStorage.getItem("token") && localStorage.getItem("user"),
  );
});

const activeView = computed(() => {
  if (!authReady.value) {
    return "loading";
  }

  if (!hasAuth.value) {
    return "login";
  }

  if (isSuperAdmin.value) {
    return "super-admin";
  }

  const status = application.value?.status;

  if (status === "APPROVED" || isArtist.value) {
    return "approved";
  }

  if (status === "PENDING") {
    return "pending";
  }

  if (status === "SUSPENDED") {
    return "suspended";
  }

  if (status === "REJECTED" && !isEditing.value) {
    return "rejected";
  }

  return "form";
});

const loginUrl = computed(() => {
  const prefix = route.path.startsWith("/en") ? "/en" : "";
  return `${prefix}/login?redirect=${encodeURIComponent(route.fullPath)}`;
});

const prefillFromUser = () => {
  form.value = {
    ...createEmptyForm(),
    artistFirstName: user.value.first_name || "",
    artistLastName: user.value.last_name || "",
    contactEmail: user.value.email || "",
    contactPhone: user.value.phone || "",
  };
};

const prefillForm = () => {
  if (!application.value) {
    prefillFromUser();
    return;
  }

  form.value = {
    artistFirstName: application.value.artistFirstName || "",
    artistLastName: application.value.artistLastName || "",
    companyCui: String(application.value.companyCui || ""),
    companyLegalName: application.value.companyLegalName || "",
    displayName: application.value.displayName || "",
    contactEmail: application.value.contactEmail || "",
    contactPhone: application.value.contactPhone || "",
    portfolioUrl: application.value.portfolioUrl || "",
  };
};

const lookupCompany = async () => {
  const result = await lookupByCui(form.value.companyCui);
  if (!result) {
    return;
  }

  form.value.companyCui = String(result.cui || "");
  form.value.companyLegalName = result.name;
  if (!form.value.displayName.trim()) {
    form.value.displayName = result.name;
  }
};

const startReapply = () => {
  prefillForm();
  isEditing.value = true;
};

const cancelReapply = () => {
  isEditing.value = false;
};

const loadApplication = async () => {
  try {
    application.value = await getMyApplication();
  } catch {
    application.value = null;
  }
};

const handleSubmit = async () => {
  if (!form.value.companyLegalName.trim()) {
    toast.add({
      severity: "warn",
      summary: t("error"),
      detail: t("companyLookupRequired"),
      life: 4000,
    });
    return;
  }

  submitting.value = true;
  try {
    application.value = await apply({
      artistFirstName: form.value.artistFirstName.trim(),
      artistLastName: form.value.artistLastName.trim(),
      companyCui: String(form.value.companyCui || "").replace(/\D/g, ""),
      companyLegalName: form.value.companyLegalName.trim(),
      displayName: form.value.displayName.trim(),
      contactEmail: form.value.contactEmail.trim(),
      contactPhone: form.value.contactPhone.trim() || undefined,
      portfolioUrl: form.value.portfolioUrl.trim() || undefined,
    });
    isEditing.value = false;
    toast.add({ severity: "success", summary: t("submitted"), life: 4000 });
  } catch (error) {
    toast.add({
      severity: "error",
      summary: t("error"),
      detail: error.message,
      life: 4000,
    });
  } finally {
    submitting.value = false;
  }
};

onMounted(async () => {
  try {
    syncFromStorage();

    if (localStorage.getItem("token")) {
      await loadUser();
      await loadApplication();
      if (!application.value) {
        prefillFromUser();
      }
      if (
        application.value?.status === "REJECTED" &&
        route.query.reapply === "1"
      ) {
        startReapply();
      }
    }
  } finally {
    authReady.value = true;
  }
});
</script>

<i18n lang="json">
{
  "ro": {
    "title": "Vinde cu noi",
    "subtitle": "Ai produse handmade? Înscrie-te ca artist și ajunge la clienții noștri.",
    "sectionArtist": "Date artist",
    "sectionCompany": "Date firmă",
    "sectionContact": "Date contact",
    "artistFirstName": "Prenume artist",
    "artistLastName": "Nume artist",
    "companyCui": "CUI firmă",
    "lookupCui": "Preia date ANAF",
    "companyLegalName": "Denumire legală firmă",
    "displayName": "Nume pe site",
    "displayNameHint": "Cum vrei să apară atelierul tău în magazin (ex: Narcis Ceramics).",
    "contactEmail": "Email contact",
    "contactPhone": "Telefon contact",
    "portfolioUrl": "Link portofoliu (opțional)",
    "companyLookupRequired": "Completează CUI-ul și preia datele firmei de la ANAF.",
    "submit": "Trimite cererea",
    "resubmit": "Retrimite cererea",
    "reapply": "Reaplică și editează datele",
    "reapplyHint": "Actualizează informațiile și trimite din nou cererea.",
    "cancel": "Anulare",
    "submitted": "Cererea a fost trimisă",
    "error": "Eroare",
    "pendingMessage": "Cererea ta este în evaluare.",
    "pendingEmailHint": "Ți-am trimis un email de confirmare cu detaliile cererii. Te vom anunța când este aprobată sau respinsă.",
    "rejectedMessage": "Cererea anterioară a fost respinsă.",
    "rejectionReason": "Motiv",
    "approvedMessage": "Ești artist aprobat pe platformă.",
    "goToPanel": "Mergi la panoul artist",
    "loginRequired": "Trebuie să fii autentificat pentru a trimite o cerere.",
    "loginCta": "Autentifică-te",
    "suspendedMessage": "Contul tău de artist este suspendat. Contactează-ne pentru detalii.",
    "superAdminMessage": "Conturile de administrator nu pot aplica ca artiști."
  },
  "en": {
    "title": "Sell with us",
    "subtitle": "Have handmade products? Join as an artist and reach our customers.",
    "sectionArtist": "Artist details",
    "sectionCompany": "Company details",
    "sectionContact": "Contact details",
    "artistFirstName": "Artist first name",
    "artistLastName": "Artist last name",
    "companyCui": "Company VAT ID",
    "lookupCui": "Fetch from ANAF",
    "companyLegalName": "Legal company name",
    "displayName": "Name on site",
    "displayNameHint": "How your studio should appear in the shop (e.g. Narcis Ceramics).",
    "contactEmail": "Contact email",
    "contactPhone": "Contact phone",
    "portfolioUrl": "Portfolio link (optional)",
    "companyLookupRequired": "Enter the VAT ID and fetch company data from ANAF.",
    "submit": "Submit application",
    "resubmit": "Resubmit application",
    "reapply": "Reapply and edit details",
    "reapplyHint": "Update your information and submit the application again.",
    "cancel": "Cancel",
    "error": "Error",
    "pendingMessage": "Your application is under review.",
    "pendingEmailHint": "We sent you a confirmation email with your application details. We will notify you when it is approved or rejected.",
    "rejectedMessage": "Your previous application was rejected.",
    "rejectionReason": "Reason",
    "approvedMessage": "You are an approved artist on the platform.",
    "goToPanel": "Go to artist panel",
    "loginRequired": "You need to be signed in to submit an application.",
    "loginCta": "Sign in",
    "suspendedMessage": "Your artist account is suspended. Contact us for details.",
    "superAdminMessage": "Administrator accounts cannot apply as artists."
  }
}
</i18n>
