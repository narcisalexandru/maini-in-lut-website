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
          :disabled="isLoading"
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
          <span class="text-red-500">*</span> {{ t("required-fields") }}
        </div>
        <form @submit.prevent="handleSubmit">
          <div class="flex flex-col gap-2">
            <div class="flex flex-row justify-center gap-4">
              <div class="flex flex-col w-1/2">
                <FormInput
                  id="first_name"
                  name="first_name"
                  :label="t('first-name')"
                  type="text"
                  v-model="formData.first_name"
                  :error="formErrors.first_name"
                  :error-message="errorMessages.first_name"
                  autocomplete="given-name"
                  required
                  @blur="() => validateField('first_name', formData.first_name)"
                />
              </div>
              <div class="flex flex-col w-1/2">
                <FormInput
                  id="last_name"
                  name="last_name"
                  :label="t('last-name')"
                  type="text"
                  v-model="formData.last_name"
                  :error="formErrors.last_name"
                  :error-message="errorMessages.last_name"
                  autocomplete="family-name"
                  required
                  @blur="() => validateField('last_name', formData.last_name)"
                />
              </div>
            </div>
            <FormInput
              id="phone"
              name="phone"
              :label="t('phone')"
              type="tel"
              v-model="formData.phone"
              :error="formErrors.phone"
              :error-message="errorMessages.phone"
              autocomplete="tel"
              :help-text="t('phone-message')"
              @blur="() => validateField('phone', formData.phone)"
            />
            <div ref="addressSection" class="text-left">
              <span
                class="text-left h-font-size-18 cursor-pointer select-none flex flex-row items-center gap-1"
                @click="isAddressCollapsed = !isAddressCollapsed"
              >
                {{ t("address") }}
                <i
                  class="ph h-font-size-18 select-none"
                  :class="
                    isAddressCollapsed ? 'ph-caret-right' : 'ph-caret-down'
                  "
                ></i>
              </span>
              <div
                v-if="!isAddressCollapsed"
                class="flex flex-col gap-2 mt-4 pb-8"
              >
                <div class="flex flex-row justify-center gap-4">
                  <div class="flex flex-col w-1/2">
                    <FormInput
                      id="county"
                      name="county"
                      :label="t('county')"
                      type="text"
                      v-model="formData.county"
                      :error="formErrors.county"
                      :error-message="errorMessages.county"
                      autocomplete="address-level2"
                      @blur="() => validateField('county', formData.county)"
                    />
                  </div>
                  <div class="flex flex-col w-1/2">
                    <FormInput
                      id="city"
                      name="city"
                      :label="t('city')"
                      type="text"
                      v-model="formData.city"
                      :error="formErrors.city"
                      :error-message="errorMessages.city"
                      autocomplete="address-level1"
                      @blur="() => validateField('city', formData.city)"
                    />
                  </div>
                </div>
                <div class="flex flex-row justify-center gap-4">
                  <div class="flex flex-col w-1/2">
                    <FormInput
                      id="street"
                      name="street"
                      :label="t('street')"
                      type="text"
                      v-model="formData.street"
                      :error="formErrors.street"
                      :error-message="errorMessages.street"
                      autocomplete="street-address"
                      @blur="() => validateField('street', formData.street)"
                    />
                  </div>
                  <div class="flex flex-col w-1/2">
                    <FormInput
                      id="postal_code"
                      name="postal_code"
                      :label="t('postal-code')"
                      type="text"
                      v-model="formData.postal_code"
                      :error="formErrors.postal_code"
                      :error-message="errorMessages.postal_code"
                      autocomplete="postal-code"
                      @blur="
                        () => validateField('postal_code', formData.postal_code)
                      "
                    />
                  </div>
                </div>
                <div class="text-left h-font-size-10 h-color-lunar-green">
                  {{ t("address-message") }}
                </div>
              </div>
            </div>
            <FormInput
              id="email"
              name="email"
              :label="t('email')"
              type="email"
              v-model="formData.email"
              :error="formErrors.email"
              :error-message="errorMessages.email"
              autocomplete="email"
              required
              @blur="() => validateField('email', formData.email)"
            />
            <FormInput
              id="password"
              name="password"
              :label="t('password')"
              type="password"
              v-model="formData.password"
              :error="formErrors.password"
              :error-message="errorMessages.password"
              autocomplete="new-password"
              required
              @blur="() => validateField('password', formData.password)"
            />
            <FormInput
              id="confirm_password"
              name="confirm_password"
              :label="t('confirm-password')"
              type="password"
              v-model="formData.confirm_password"
              :error="formErrors.confirm_password"
              :error-message="errorMessages.confirm_password"
              autocomplete="new-password"
              required
              @blur="
                () =>
                  validateField('confirm_password', formData.confirm_password)
              "
            />
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
                <span class="h-font-size-12 h-color-lunar-green">{{
                  t(requirement.message)
                }}</span>
              </div>
            </div>
            <div class="flex flex-col gap-2 my-4">
              <div
                class="flex flex-row gap-1"
                :class="{
                  'border border-red-500 p-1 rounded': formErrors.acceptTerms,
                }"
              >
                <input
                  type="checkbox"
                  id="accept_terms"
                  class="h-font-size-14"
                  v-model="formData.acceptTerms"
                  @change="
                    () =>
                      validateField(
                        'acceptTerms',
                        formData.acceptTerms.toString()
                      )
                  "
                />
                <div
                  class="h-font-size-12 text-left h-color-lunar-green"
                  :class="{ 'text-red-500': formErrors.acceptTerms }"
                >
                  {{ t("accept-terms-message") }}
                  <nuxt-link
                    to="/terms-and-conditions"
                    class="underline h-color-palm-leaf"
                    >{{ t("terms-and-conditions") }}</nuxt-link
                  >
                </div>
              </div>
            </div>
            <Button
              class="maini-ui-button__primary w-full"
              type="submit"
              :disabled="isLoading"
            >
              {{ isLoading ? t("loading") : t("sign-up-button") }}
            </Button>
          </div>
        </form>
        <div
          class="flex justify-center h-font-size-12 h-color-lunar-green mt-4"
        >
          {{ t("already-have-account") }} &nbsp;
          <nuxt-link
            :to="$localePath('/login')"
            class="h-font-size-12 underline h-color-palm-leaf"
            >{{ t("sign-in") }}</nuxt-link
          >
        </div>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { ref, computed } from "vue";
import { useRouter } from "vue-router";
import { useI18n } from "vue-i18n";
import FormInput from "~/components/FormInput.vue";
import { useAuth } from "~/composables/useAuth";
import { useFormValidation } from "~/composables/useFormValidation";
import autoAnimate from "@formkit/auto-animate";

defineI18nRoute({
  paths: {
    ro: "/inregistrare",
    en: "/register",
  },
});

const { t } = useI18n({
  useScope: "local",
});

const router = useRouter();
const { register, googleAuth, isLoading, error } = useAuth();

const isAddressCollapsed = ref(true);
const addressSection = ref();

const formData = ref({
  first_name: "",
  last_name: "",
  phone: "",
  county: "",
  city: "",
  street: "",
  postal_code: "",
  email: "",
  password: "",
  confirm_password: "",
  acceptTerms: false,
});

const validationRules = {
  first_name: [
    {
      required: true,
      message: t("required-field"),
    },
  ],
  last_name: [
    {
      required: true,
      message: t("required-field"),
    },
  ],
  phone: [
    {
      pattern: /^[0-9]{10}$/,
      message: t("phone-must-be-10-digits"),
    },
  ],
  email: [
    {
      required: true,
      pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
      message: t("invalid-email"),
    },
  ],
  password: [
    {
      required: true,
      minLength: 8,
      message: t("password-too-short"),
    },
    {
      pattern: /[A-Z]/,
      message: t("password-uppercase"),
    },
    {
      pattern: /[0-9]/,
      message: t("password-numbers"),
    },
    {
      pattern: /[!@#$%^&*]/,
      message: t("password-special-characters"),
    },
  ],
  confirm_password: [
    {
      required: true,
      message: t("required-field"),
    },
    {
      custom: (value: string) => value === formData.value.password,
      message: t("passwords-do-not-match"),
    },
  ],
  acceptTerms: [
    {
      required: true,
      message: t("required-field"),
    },
  ],
  county: [
    {
      pattern: /^[a-zA-Z\s]*$/,
      message: t("invalid-county"),
    },
  ],
  city: [
    {
      pattern: /^[a-zA-Z\s.]*$/,
      message: t("invalid-city"),
    },
  ],
  postal_code: [
    {
      pattern: /^[0-9]{6}$/,
      message: t("postal-code-must-be-6-digits"),
    },
  ],
};

onMounted(() => {
  autoAnimate(addressSection.value);
});

const { formErrors, errorMessages, validateField, validateForm } =
  useFormValidation(validationRules);

const hasMinLength = computed(
  () => (formData.value.password?.length || 0) >= 8
);
const hasUppercase = computed(() =>
  /[A-Z]/.test(formData.value.password || "")
);
const hasNumber = computed(() => /[0-9]/.test(formData.value.password || ""));
const hasSpecialChar = computed(() =>
  /[!@#$%^&*]/.test(formData.value.password || "")
);
const passwordsMatch = computed(
  () =>
    formData.value.password &&
    formData.value.confirm_password &&
    formData.value.password === formData.value.confirm_password
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

const handleSubmit = async () => {
  const formDataToValidate = {
    ...formData.value,
    acceptTerms: formData.value.acceptTerms.toString(),
  };

  if (!validateForm(formDataToValidate)) {
    return;
  }

  if (formData.value.password !== formData.value.confirm_password) {
    formErrors.value.confirm_password = true;
    errorMessages.value.confirm_password = t("passwords-do-not-match");
    return;
  }

  if (!formData.value.acceptTerms) {
    formErrors.value.acceptTerms = true;
    errorMessages.value.acceptTerms = t("required-field");
    return;
  }

  const { confirm_password, acceptTerms, ...registerData } = formData.value;
  const result = await register(registerData);

  if (result && "field" in result) {
    formErrors.value[result.field] = true;
    errorMessages.value[result.field] = result.message;
  }
};

const handleGoogleLogin = () => {
  googleAuth();
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
    "county": "County",
    "city": "City",
    "street": "Street and Number",
    "postal-code": "Postal Code",
    "address-message": "You can complete your address later in your profile",
    "password": "Password",
    "confirm-password": "Confirm Password",
    "sign-up-button": "Create Account",
    "required-fields": "Required fields",
    "required-field": "This field is required",
    "password-too-short": "Password must be at least 8 characters long",
    "password-characters": "Password must be at least 8 characters long",
    "password-uppercase": "Password must contain at least one uppercase letter",
    "password-numbers": "Password must contain at least one number",
    "password-special-characters": "Password must contain at least one special character",
    "passwords-do-not-match": "Password confirmation should match the password",
    "accept-terms-message": "By registering, you agree to the",
    "terms-and-conditions": "Terms and Conditions",
    "email-already-exists": "This email address is already in use",
    "phone-already-exists": "This phone number is already in use",
    "loading": "Loading...",
    "invalid-email": "Please enter a valid email address",
    "phone-must-be-10-digits": "Phone number must be 10 digits",
    "already-have-account": "Already have an account?",
    "sign-in": "Sign in",
    "postal-code-must-be-6-digits": "Postal code must be 6 digits",
    "invalid-county": "Invalid county",
    "invalid-city": "Invalid city",
    "invalid-postal-code": "Invalid postal code"
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
    "county": "Județ",
    "city": "Oraș",
    "street": "Stradă și Număr",
    "postal-code": "Cod Postal",
    "address-message": "Poți completa adresa mai târziu în profilul tău",
    "password": "Parolă",
    "confirm-password": "Confirmă Parola",
    "sign-up-button": "Creează Cont",
    "required-fields": "Câmpuri obligatorii",
    "required-field": "Acest câmp este obligatoriu",
    "password-too-short": "Parola trebuie să aibă cel puțin 8 caractere",
    "password-characters": "Parola trebuie să aibă cel puțin 8 caractere",
    "password-uppercase": "Parola trebuie să conțină cel puțin o literă mare",
    "password-numbers": "Parola trebuie să conțină cel puțin un număr",
    "password-special-characters": "Parola trebuie să conțină cel puțin un caracter special",
    "passwords-do-not-match": "Confirmarea parolei trebuie sa coincida cu parola",
    "accept-terms-message": "Prin înregistrare, accepți",
    "terms-and-conditions": "Termenii și Condițiile",
    "email-already-exists": "Această adresă de email este deja utilizată",
    "phone-already-exists": "Acest număr de telefon este deja utilizat",
    "loading": "Se încarcă...",
    "invalid-email": "Vă rugăm să introduceți o adresă de email validă",
    "phone-must-be-10-digits": "Numărul de telefon trebuie să aibă 10 cifre",
    "already-have-account": "Aveți deja un cont?",
    "sign-in": "Autentificare",
    "postal-code-must-be-6-digits": "Codul postal trebuie să aibă 6 cifre",
    "invalid-county": "Județ invalid",
    "invalid-city": "Oraș invalid",
    "invalid-postal-code": "Cod postal invalid"
  }
}
</i18n>
