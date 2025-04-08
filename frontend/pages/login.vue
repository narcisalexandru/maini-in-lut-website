<template>
  <section class="maini-ui__section">
    <div class="maini-ui__extra-small-container">
      <div class="text-center h-bg-white rounded-lg shadow-lg p-8">
        <div class="h-font-weight-600 h-font-size-28 mt-8 h-color-palm-leaf">
          {{ t("heading") }}
        </div>
        <div
          class="h-font-weight-400 h-font-size-14 mb-8 mt-1 h-color-lunar-green"
        >
          {{ t("sub-heading") }}
        </div>
        <form @submit.prevent="handleSubmit">
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
            autocomplete="current-password"
            required
            @blur="() => validateField('password', formData.password)"
          />
          <div class="flex justify-start mt-1">
            <NuxtLink
              to="#"
              class="h-font-weight-400 h-font-size-12 h-color-lunar-green underline"
              >{{ t("forgot-password") }}</NuxtLink
            >
          </div>
          <Button
            class="maini-ui-button__primary h-font-size-14 mt-4 w-full"
            type="submit"
            :disabled="isLoading"
          >
            {{ isLoading ? t("loading") : t("sign-in-cta") }}
          </Button>
        </form>
        <div class="my-6">
          <div class="relative">
            <div class="absolute inset-0 flex items-center">
              <div class="w-full border-t border-gray-300"></div>
            </div>
            <div class="relative flex justify-center text-sm">
              <span
                class="px-2 h-font-size-12 h-bg-white h-color-lunar-green"
                >{{ t("or-continue-with") }}</span
              >
            </div>
          </div>
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
          {{ t("sign-in-with-google-cta") }}
        </Button>
        <div class="flex flex-row justify-center mt-6">
          <div class="mr-1 h-font-size-12 h-color-lunar-green">
            {{ t("dont-have-account") }}
          </div>
          <NuxtLink
            to="/register"
            class="h-font-weight-400 h-font-size-12 h-color-lunar-green underline"
          >
            {{ t("sign-up") }}
          </NuxtLink>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { ref } from "vue";
import { useRouter } from "vue-router";
import { useI18n } from "vue-i18n";
import FormInput from "~/components/FormInput.vue";
import { useAuth } from "~/composables/useAuth";
import { useFormValidation } from "~/composables/useFormValidation";

const router = useRouter();
const { t } = useI18n({
  useScope: "local",
});

const { login, googleAuth, isLoading, error } = useAuth();

const formData = ref({
  email: "",
  password: "",
});

const validationRules = {
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
  ],
};

const { formErrors, errorMessages, validateField, validateForm } =
  useFormValidation(validationRules);

const handleSubmit = async () => {
  if (!validateForm(formData.value)) {
    return;
  }

  await login(formData.value.email, formData.value.password);
};

const handleGoogleLogin = () => {
  googleAuth();
};
</script>

<i18n lang="json">
{
  "en": {
    "heading": "Welcome back!",
    "sub-heading": "Sign in to your account",
    "email": "Email",
    "password": "Password",
    "sign-in-cta": "Sign in",
    "sign-in-with-google-cta": "Sign in with Google",
    "forgot-password": "Forgot your password?",
    "dont-have-account": "Don't have an account?",
    "sign-up": "Sign up",
    "or-continue-with": "Or continue with",
    "loading": "Loading...",
    "invalid-email": "Please enter a valid email address",
    "password-too-short": "Password must be at least 8 characters long"
  },
  "ro": {
    "heading": "Bine ai revenit!",
    "sub-heading": "Autentificare în contul dvs.",
    "email": "Email",
    "password": "Parola",
    "sign-in-cta": "Autentificare",
    "sign-in-with-google-cta": "Autentificare cu Google",
    "forgot-password": "Ai uitat parola?",
    "dont-have-account": "Nu ai un cont?",
    "sign-up": "Înregistrează-te",
    "or-continue-with": "Sau continuă cu",
    "loading": "Se încarcă...",
    "invalid-email": "Vă rugăm să introduceți o adresă de email validă",
    "password-too-short": "Parola trebuie să aibă cel puțin 8 caractere"
  }
}
</i18n>
