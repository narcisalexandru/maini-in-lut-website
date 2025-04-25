<template>
  <section class="maini-ui__section">
    <div class="maini-ui__container">
      <h1 class="maini-ui__heading text-left">{{ t("title") }}</h1>
      <div class="h-font-size-16 text-left mb-8">{{ t("sub-title") }}</div>
      <div class="maini-ui__container h-bg-white p-8 rounded-xl shadow-md">
        <div class="flex flex-row">
          <div class="flex w-1/5 justify-center">
            <nuxt-img
              :src="user.picture"
              :alt="user.name"
              class="w-24 h-24 rounded-full"
            />
          </div>
          <div class="flex flex-col w-full">
            <div class="flex flex-row gap-96 w-full">
              <div class="flex flex-col">
                <div class="h-font-size-16 h-color-lunar-green">
                  {{ t("first-name") }}
                </div>
                <div class="h-font-size-16">
                  {{ user.first_name }}
                </div>
              </div>
              <div class="flex flex-col">
                <div class="h-font-size-16 h-color-lunar-green">
                  {{ t("last-name") }}
                </div>
                <div class="h-font-size-16">
                  {{ user.last_name }}
                </div>
              </div>
            </div>
            <div class="mt-4">
              <div class="h-color-lunar-green">
                {{ t("email") }}
              </div>
              <div class="h-font-size-16">
                {{ user.email }}
              </div>
            </div>
            <div class="mt-4">
              <div class="flex items-center">
                <div class="h-color-lunar-green">
                  {{ t("address") }}
                </div>
                <i
                  @click="toggleAddressEdit"
                  class="ph ph-note-pencil h-color-lunar-green cursor-pointer hover:text-gray-700 ml-1 items-center"
                />
              </div>
              <div v-if="!isEditingAddress" class="h-font-size-16">
                {{
                  user.county && user.city && user.street && user.postal_code
                    ? `${user.county}, ${user.city}, ${user.street}, ${user.postal_code}`
                    : t("no-address")
                }}
              </div>
              <div v-else class="space-y-4 mt-2">
                <FormInput
                  id="county"
                  name="county"
                  :label="t('county')"
                  type="text"
                  v-model="addressForm.county"
                  :error="formErrors.county"
                  :error-message="errorMessages.county"
                  autocomplete="address-level2"
                  @blur="() => validateField('county', addressForm.county)"
                />

                <FormInput
                  id="city"
                  name="city"
                  :label="t('city')"
                  type="text"
                  v-model="addressForm.city"
                  :error="formErrors.city"
                  :error-message="errorMessages.city"
                  autocomplete="address-level1"
                  @blur="() => validateField('city', addressForm.city)"
                />

                <FormInput
                  id="street"
                  name="street"
                  :label="t('street')"
                  type="text"
                  v-model="addressForm.street"
                  :error="formErrors.street"
                  :error-message="errorMessages.street"
                  autocomplete="street-address"
                  @blur="() => validateField('street', addressForm.street)"
                />

                <FormInput
                  id="postal_code"
                  name="postal_code"
                  :label="t('postal-code')"
                  type="text"
                  v-model="addressForm.postal_code"
                  :error="formErrors.postal_code"
                  :error-message="errorMessages.postal_code"
                  autocomplete="postal-code"
                  @blur="
                    () => validateField('postal_code', addressForm.postal_code)
                  "
                />

                <div class="flex justify-end space-x-4 mt-4">
                  <Button
                    type="button"
                    class="maini-ui-button__secondary"
                    severity="danger"
                    @click="cancelAddressEdit"
                  >
                    {{ t("cancel") }}
                  </Button>
                  <Button
                    type="button"
                    class="maini-ui-button__primary"
                    @click="saveAddress"
                    :disabled="isLoading"
                  >
                    {{ isLoading ? t("saving") : t("save") }}
                  </Button>
                </div>
              </div>
            </div>
            <div class="mt-4">
              <div class="h-color-lunar-green">
                {{ t("phone") }}
              </div>
              <div class="h-font-size-16">
                {{ user.phone || `${t("no-phone")}` }}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup>
import { ref, onMounted } from "vue";
import { useAuth } from "~/composables/useAuth";
import FormInput from "~/components/FormInput.vue";
import { useFormValidation } from "~/composables/useFormValidation";
import { useToast } from "primevue/usetoast";
import { useRuntimeConfig } from "nuxt/app";

defineI18nRoute({
  paths: {
    ro: "/profil",
    en: "/profile",
  },
});

const { t } = useI18n({
  useScope: "local",
});

const { user, isAuthenticated, checkAuth, loadUser, logout, updateProfile } =
  useAuth();
const isEditingAddress = ref(false);
const isLoading = ref(false);
const toast = useToast();
const config = useRuntimeConfig();

const addressForm = ref({
  county: "",
  city: "",
  street: "",
  postal_code: "",
});

const validationRules = {
  county: [
    {
      pattern: /^[a-zA-Z\s]*$/,
      message: t("invalid-county"),
    },
    {
      required: true,
      message: t("county-required"),
    },
  ],
  city: [
    {
      pattern: /^[a-zA-Z\s.]*$/,
      message: t("invalid-city"),
    },
    {
      required: true,
      message: t("city-required"),
    },
  ],
  street: [
    {
      required: true,
      message: t("street-required"),
    },
  ],
  postal_code: [
    {
      pattern: /^[0-9]{6}$/,
      message: t("postal-code-must-be-6-digits"),
    },
    {
      required: true,
      message: t("postal-code-required"),
    },
  ],
};

const { formErrors, errorMessages, validateField, validateForm } =
  useFormValidation(validationRules);

onMounted(() => {
  if (checkAuth()) {
    loadUser();
  }
});

const toggleAddressEdit = async () => {
  try {
    // Check address modification status
    const response = await fetch(
      `${config.public.apiBase}/users/profile/address-status`,
      {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      }
    );

    if (!response.ok) {
      throw new Error("Failed to check address status");
    }

    const status = await response.json();

    if (status.inCooldown) {
      toast.add({
        severity: "warn",
        summary: t("cooldown-title"),
        detail: t("address-cooldown-message", {
          time: status.cooldownRemaining,
        }),
        life: 3000,
      });
      return;
    }

    isEditingAddress.value = true;
    addressForm.value = {
      county: user.value.county || "",
      city: user.value.city || "",
      street: user.value.street || "",
      postal_code: user.value.postal_code || "",
    };
  } catch (error) {
    console.error("Error checking address status:", error);
    toast.add({
      severity: "error",
      summary: t("error-title"),
      detail: t("error-checking-status"),
      life: 3000,
    });
  }
};

const cancelAddressEdit = () => {
  isEditingAddress.value = false;
  addressForm.value = {
    county: "",
    city: "",
    street: "",
    postal_code: "",
  };
};

const saveAddress = async () => {
  if (!validateForm(addressForm.value)) {
    return;
  }

  // Check if any changes were made
  const hasChanges =
    addressForm.value.county !== user.value.county ||
    addressForm.value.city !== user.value.city ||
    addressForm.value.street !== user.value.street ||
    addressForm.value.postal_code !== user.value.postal_code;

  if (!hasChanges) {
    isEditingAddress.value = false;
    toast.add({
      severity: "info",
      summary: t("no-changes-title"),
      detail: t("no-changes-made"),
      life: 3000,
    });
    return;
  }

  // Additional validation to ensure no empty fields
  if (
    !addressForm.value.county ||
    !addressForm.value.city ||
    !addressForm.value.street ||
    !addressForm.value.postal_code
  ) {
    return;
  }

  isLoading.value = true;
  try {
    const response = await fetch(
      `${config.public.apiBase}/users/profile/address`,
      {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify(addressForm.value),
      }
    );

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.message || "Failed to update address");
    }

    if (result.success) {
      isEditingAddress.value = false;
      try {
        await loadUser();
        toast.add({
          severity: "success",
          summary: t("success-title"),
          detail: t("address-updated"),
          life: 3000,
        });
      } catch (error) {
        console.error("Error reloading user data:", error);
        toast.add({
          severity: "error",
          summary: t("error-title"),
          detail: t("error-loading-user-data"),
          life: 3000,
        });
      }
    }
  } catch (error) {
    console.error("Error saving address:", error);
    toast.add({
      severity: "error",
      summary: t("error-title"),
      detail: error.message || t("error-saving-address"),
      life: 3000,
    });
  } finally {
    isLoading.value = false;
  }
};

const handleLogout = () => {
  logout();
};
</script>

<i18n lang="json">
{
  "en": {
    "title": "My Profile",
    "sub-title": "Manage your personal information and account settings",
    "first-name": "First Name",
    "last-name": "Last Name",
    "email": "Email",
    "phone": "Phone",
    "address": "Address",
    "city": "City",
    "no-address": "Add an address",
    "no-phone": "Add a phone number",
    "county": "County",
    "street": "Street and Number",
    "postal-code": "Postal Code",
    "cancel": "Cancel",
    "save": "Save",
    "saving": "Saving...",
    "invalid-county": "Invalid county",
    "invalid-city": "Invalid city",
    "postal-code-must-be-6-digits": "Postal code must be 6 digits",
    "county-required": "County is required",
    "city-required": "City is required",
    "street-required": "Street is required",
    "postal-code-required": "Postal code is required",
    "cooldown-title": "Cooldown Period",
    "no-changes-title": "No Changes",
    "error-title": "Error",
    "success-title": "Success",
    "address-cooldown-message": "Please wait {time} seconds before modifying your address again",
    "no-changes-made": "No changes were made to the address",
    "error-saving-address": "An error occurred while saving your address",
    "error-checking-status": "Error checking address modification status",
    "address-updated": "Address updated successfully",
    "error-loading-user-data": "An error occurred while reloading user data"
  },
  "ro": {
    "title": "Profilul meu",
    "sub-title": "Gestionează informațiile personale și setările contului",
    "first-name": "Prenume",
    "last-name": "Nume",
    "email": "Email",
    "phone": "Telefon",
    "address": "Adresa",
    "city": "Oras",
    "no-address": "Adaugă o adresă",
    "no-phone": "Adaugă un număr de telefon",
    "county": "Județ",
    "street": "Stradă și Număr",
    "postal-code": "Cod Postal",
    "cancel": "Anulare",
    "save": "Salvare",
    "saving": "Se salvează...",
    "invalid-county": "Județ invalid",
    "invalid-city": "Oraș invalid",
    "postal-code-must-be-6-digits": "Codul postal trebuie să aibă 6 cifre",
    "county-required": "Județul este obligatoriu",
    "city-required": "Orașul este obligatoriu",
    "street-required": "Strada este obligatorie",
    "postal-code-required": "Codul postal este obligatoriu",
    "cooldown-title": "Perioadă de Așteptare",
    "no-changes-title": "Fără Modificări",
    "error-title": "Eroare",
    "success-title": "Succes",
    "address-cooldown-message": "Vă rugăm să așteptați {time} secunde înainte de a modifica adresa din nou",
    "no-changes-made": "Nu au fost făcute modificări la adresă",
    "error-saving-address": "A apărut o eroare la salvarea adresei",
    "error-checking-status": "Eroare la verificarea stării modificării adresei",
    "address-updated": "Adresa a fost actualizată cu succes",
    "error-loading-user-data": "A apărut o eroare la reîncărcarea datelor utilizatorului"
  }
}
</i18n>
