<template>
  <section class="maini-ui__section">
    <div class="maini-ui__small-container">
      <div class="text-center h-bg-white rounded-lg shadow-lg p-8">
        <div class="h-font-weight-600 h-font-size-28 mt-8 h-color-palm-leaf">
          {{ t("heading") }}
        </div>
        <div
          class="h-font-weight-400 h-font-size-14 mb-8 mt-1 h-color-lunar-green"
        >
          {{ t("sub-heading") }}
        </div>
        <Button
          class="maini-ui-button__google h-color-black h-bg-white w-full flex items-center justify-center gap-2"
          @click="handleGoogleLogin"
        >
          <nuxt-img
            src="images/google-logo.svg"
            alt="Google"
            class="w-4 h-4 mr-1"
          />
          {{ t("sign-up-google-cta") }}
        </Button>
        <div class="my-6">
          <div class="relative">
            <div class="absolute inset-0 flex items-center">
              <div class="w-full border-t border-gray-300"></div>
            </div>
            <div class="relative flex justify-center text-sm">
              <span
                class="px-2 h-font-size-12 h-bg-white h-color-lunar-green"
                >{{ t("or-sign-up-with-email") }}</span
              >
            </div>
          </div>
        </div>
        <div class="text-left h-font-size-12 h-color-lunar-green mb-2">
          *{{ t("required-fields") }}
        </div>
        <form @submit.prevent="handleRegister">
          <div class="flex flex-col gap-2">
            <div class="flex flex-row justify-center gap-4">
              <div class="flex flex-col w-1/2">
                <label class="h-font-size-14 text-left"
                  >{{ t("first-name") }} *</label
                >
                <Input
                  type="text"
                  autocomplete="given-name"
                  id="first_name"
                  class="h-bg-alto h-font-weight-400 h-font-size-14 rounded-md p-1 inset-shadow-sm"
                  :class="{ 'border-red-500': formErrors.first_name }"
                  v-model="first_name"
                />
                <span
                  v-if="formErrors.first_name"
                  class="text-red-500 text-sm mt-1"
                >
                  {{ t("required-field") }}
                </span>
              </div>
              <div class="flex flex-col w-1/2">
                <label class="h-font-size-14 text-left"
                  >{{ t("last-name") }} *</label
                >
                <Input
                  type="text"
                  autocomplete="family-name"
                  id="last_name"
                  class="h-bg-alto h-font-weight-400 h-font-size-14 rounded-md p-1 inset-shadow-sm"
                  :class="{ 'border-red-500': formErrors.last_name }"
                  v-model="last_name"
                />
                <span
                  v-if="formErrors.last_name"
                  class="text-red-500 text-sm mt-1"
                >
                  {{ t("required-field") }}
                </span>
              </div>
            </div>
            <div class="flex flex-col">
              <label class="h-font-size-14 text-left">{{ t("phone") }} *</label>
              <Input
                type="text"
                autocomplete="tel"
                id="phone"
                class="h-bg-alto h-font-weight-400 h-font-size-14 rounded-md p-1 inset-shadow-sm"
                :class="{ 'border-red-500': formErrors.phone }"
                v-model="phone"
              />
              <span v-if="formErrors.phone" class="text-red-500 text-sm mt-1">
                {{ t("required-field") }}
              </span>
              <div class="h-font-size-10 text-left h-color-lunar-green mt-1">
                {{ t("phone-message") }} *
              </div>
            </div>
            <div class="flex flex-col">
              <label class="h-font-size-14 text-left"
                >{{ t("address") }} *</label
              >
              <Input
                type="text"
                autocomplete="address"
                id="address"
                class="h-bg-alto h-font-weight-400 h-font-size-14 rounded-md p-1 inset-shadow-sm"
                :class="{ 'border-red-500': formErrors.address }"
                v-model="address"
              />
              <span v-if="formErrors.address" class="text-red-500 text-sm mt-1">
                {{ t("required-field") }}
              </span>
            </div>
            <div class="flex flex-col">
              <label class="h-font-size-14 text-left">{{ t("email") }} *</label>
              <Input
                type="email"
                autocomplete="email"
                id="email"
                class="h-bg-alto h-font-weight-400 h-font-size-14 rounded-md p-1 inset-shadow-sm"
                :class="{ 'border-red-500': formErrors.email }"
                v-model="email"
              />
              <span v-if="formErrors.email" class="text-red-500 text-sm mt-1">
                {{ t("required-field") }}
              </span>
            </div>
            <div class="flex flex-col">
              <label class="h-font-size-14 text-left"
                >{{ t("password") }} *</label
              >
              <Input
                type="password"
                autocomplete="new-password"
                id="password"
                class="h-bg-alto h-font-weight-400 h-font-size-14 rounded-md p-1 inset-shadow-sm"
                :class="{ 'border-red-500': formErrors.password }"
                v-model="password"
              />
              <span
                v-if="formErrors.password"
                class="text-red-500 text-sm mt-1"
              >
                {{ t("required-field") }}
              </span>
            </div>
            <div class="flex flex-col">
              <label class="h-font-size-14 text-left"
                >{{ t("confirm-password") }} *</label
              >
              <Input
                type="password"
                autocomplete="new-password"
                id="confirm_password"
                class="h-bg-alto h-font-weight-400 h-font-size-14 rounded-md p-1 inset-shadow-sm"
                :class="{ 'border-red-500': formErrors.confirmPassword }"
                v-model="confirmPassword"
              />
              <span
                v-if="formErrors.confirmPassword"
                class="text-red-500 text-sm mt-1"
              >
                {{ t("required-field") }}
              </span>
            </div>
            <div class="flex flex-col gap-1 mt-2">
              <div
                v-for="(requirement, index) in passwordRequirements"
                :key="index"
                class="flex items-center gap-1"
              >
                <i
                  class="h-font-size-14"
                  :class="
                    requirement.valid
                      ? 'ph ph-check-circle text-green-500'
                      : 'ph ph-x-circle text-red-500'
                  "
                />
                <span
                  class="h-font-size-12"
                  :class="requirement.valid ? 'text-green-500' : 'text-red-500'"
                  >{{ t(requirement.message) }}</span
                >
              </div>
            </div>
            <div class="flex flex-col gap-2">
              <div class="flex flex-row gap-1">
                <Input
                  type="checkbox"
                  id="accept_terms"
                  v-model="acceptTerms"
                />
                <div
                  class="h-font-size-10 text-left h-color-lunar-green mt-1"
                  :class="{ 'text-red-500': formErrors.acceptTerms }"
                >
                  {{ t("accept-terms-message") }}
                </div>
              </div>
              <span
                v-if="formErrors.acceptTerms"
                class="text-red-500 text-sm mt-1"
              >
                {{ t("required-field") }}
              </span>
            </div>
            <Button
              class="maini-ui-button__primary w-full"
              @click="handleRegister"
            >
              {{ t("sign-up-button") }}
            </Button>
          </div>
        </form>
      </div>
    </div>
  </section>
</template>

<script setup>
import { ref, computed } from "vue";
import { useRouter } from "vue-router";
import { useI18n } from "vue-i18n";

const { t } = useI18n({
  useScope: "local",
});

const router = useRouter();
const email = ref("");
const password = ref("");
const confirmPassword = ref("");
const first_name = ref("");
const last_name = ref("");
const address = ref("");
const phone = ref("");
const acceptTerms = ref(false);

const formErrors = ref({
  first_name: false,
  last_name: false,
  phone: false,
  address: false,
  email: false,
  password: false,
  confirmPassword: false,
  acceptTerms: false,
});

const hasMinLength = computed(() => (password.value?.length || 0) >= 8);
const hasUppercase = computed(() => /[A-Z]/.test(password.value || ""));
const hasNumber = computed(() => /[0-9]/.test(password.value || ""));
const hasSpecialChar = computed(() => /[!@#$%^&*]/.test(password.value || ""));
const passwordsMatch = computed(
  () =>
    password.value &&
    confirmPassword.value &&
    password.value === confirmPassword.value
);

const isPasswordValid = computed(
  () =>
    hasMinLength.value &&
    hasUppercase.value &&
    hasNumber.value &&
    hasSpecialChar.value
);

const passwordRequirements = computed(() => [
  {
    valid: hasMinLength.value,
    message: "password-characters",
  },
  {
    valid: hasUppercase.value,
    message: "password-uppercase",
  },
  {
    valid: hasNumber.value,
    message: "password-numbers",
  },
  {
    valid: hasSpecialChar.value,
    message: "password-special-characters",
  },
  {
    valid: passwordsMatch.value,
    message: "passwords-do-not-match",
  },
]);

const validateForm = () => {
  // Reset all errors first
  Object.keys(formErrors.value).forEach((key) => {
    formErrors.value[key] = false;
  });

  let isValid = true;

  // Basic field validation
  if (!first_name.value?.trim()) {
    formErrors.value.first_name = true;
    isValid = false;
  }
  if (!last_name.value?.trim()) {
    formErrors.value.last_name = true;
    isValid = false;
  }
  if (!phone.value?.trim()) {
    formErrors.value.phone = true;
    isValid = false;
  }
  if (!address.value?.trim()) {
    formErrors.value.address = true;
    isValid = false;
  }
  if (!email.value?.trim()) {
    formErrors.value.email = true;
    isValid = false;
  }

  // Password validation
  if (!password.value?.trim()) {
    formErrors.value.password = true;
    isValid = false;
  } else if (!isPasswordValid.value) {
    formErrors.value.password = true;
    isValid = false;
  }

  // Confirm password validation
  if (!confirmPassword.value?.trim()) {
    formErrors.value.confirmPassword = true;
    isValid = false;
  } else if (!passwordsMatch.value) {
    formErrors.value.confirmPassword = true;
    isValid = false;
  }

  // Terms validation
  if (!acceptTerms.value) {
    formErrors.value.acceptTerms = true;
    isValid = false;
  }

  return isValid;
};

const handleRegister = async () => {
  if (!validateForm()) {
    return;
  }

  try {
    const response = await fetch("http://localhost:4000/auth/register", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email: email.value,
        password: password.value,
        first_name: first_name.value,
        last_name: last_name.value,
        address: address.value,
        phone: phone.value,
      }),
    });

    const data = await response.json();
    if (data.access_token) {
      localStorage.setItem("token", data.access_token);
      localStorage.setItem("user", JSON.stringify(data.user));
      router.push("/profile");
    }
  } catch (error) {
    console.error("Registration failed:", error);
  }
};
</script>

<i18n lang="json">
{
  "en": {
    "heading": "Create Your Account",
    "sub-heading": "Join our community of ceramic enthusiasts",
    "sign-up-google-cta": "Sign up with Google",
    "or-sign-up-with-email": "Or sign up with email",
    "first-name": "First Name",
    "last-name": "Last Name",
    "phone": "Phone Number",
    "phone-message": "We'll only use this to contact you about orders",
    "email": "Email",
    "address": "Address",
    "password": "Password",
    "confirm-password": "Confirm Password",
    "sign-up-button": "Create Account",
    "already-have-account": "Already have an account? Sign in",
    "required-fields": "Required fields",
    "required-field": "This field is required",
    "password-characters": "Password must be at least 8 characters long",
    "password-uppercase": "Password must contain at least one uppercase letter",
    "password-numbers": "Password must contain at least one number",
    "password-special-characters": "Password must contain at least one special character",
    "passwords-do-not-match": "Passwords do not match",
    "accept-terms": "Accept Terms and Conditions",
    "accept-terms-message": "By registering, you agree to the Terms and Conditions of the site"
  },
  "ro": {
    "heading": "Creează-ți Contul",
    "sub-heading": "Alătură-te comunității noastre de entuziaști ai ceramicii",
    "sign-up-google-cta": "Înregistrează-te cu Google",
    "or-sign-up-with-email": "Sau înregistrează-te cu email",
    "first-name": "Prenume",
    "last-name": "Nume",
    "phone": "Număr de Telefon",
    "phone-message": "Vom folosi acest număr doar pentru a te contacta despre comenzi",
    "email": "Email",
    "address": "Adresă",
    "password": "Parolă",
    "confirm-password": "Confirmă Parola",
    "sign-up-button": "Creează Cont",
    "already-have-account": "Ai deja un cont? Conectează-te",
    "required-fields": "Câmpuri obligatorii",
    "required-field": "Acest câmp este obligatoriu",
    "password-characters": "Parola trebuie să aibă cel puțin 8 caractere",
    "password-uppercase": "Parola trebuie să conțină cel puțin o literă mare",
    "password-numbers": "Parola trebuie să conțină cel puțin un număr",
    "password-special-characters": "Parola trebuie să conțină cel puțin un caracter special",
    "passwords-do-not-match": "Parolele nu coincid",
    "accept-terms": "Acceptă Termeni și Condiții",
    "accept-terms-message": "Prin înregistrare, acceptă Termenii și Condițiile de utilizare a site-ului"
  }
}
</i18n>
