import { ref, computed } from "vue";

interface ValidationRule {
  required?: boolean;
  minLength?: number;
  maxLength?: number;
  pattern?: RegExp;
  custom?: (value: string) => boolean;
  message: string;
}

interface ValidationRules {
  [key: string]: ValidationRule[];
}

interface FormErrors {
  [key: string]: boolean;
}

interface ErrorMessages {
  [key: string]: string;
}

export const useFormValidation = (rules: ValidationRules) => {
  const formErrors = ref<FormErrors>({});
  const errorMessages = ref<ErrorMessages>({});
  const isFormValid = ref(false);

  const validateField = (field: string, value: string): boolean => {
    const fieldRules = rules[field];
    if (!fieldRules) return true;

    for (const rule of fieldRules) {
      if (rule.required && !value?.trim()) {
        formErrors.value[field] = true;
        errorMessages.value[field] = rule.message;
        return false;
      }

      if (value && rule.minLength && value.length < rule.minLength) {
        formErrors.value[field] = true;
        errorMessages.value[field] = rule.message;
        return false;
      }

      if (value && rule.maxLength && value.length > rule.maxLength) {
        formErrors.value[field] = true;
        errorMessages.value[field] = rule.message;
        return false;
      }

      if (value && rule.pattern && !rule.pattern.test(value)) {
        formErrors.value[field] = true;
        errorMessages.value[field] = rule.message;
        return false;
      }

      if (value && rule.custom && !rule.custom(value)) {
        formErrors.value[field] = true;
        errorMessages.value[field] = rule.message;
        return false;
      }
    }

    formErrors.value[field] = false;
    errorMessages.value[field] = "";
    return true;
  };

  const validateForm = (formData: { [key: string]: string }): boolean => {
    let isValid = true;
    Object.keys(rules).forEach((field) => {
      if (!validateField(field, formData[field])) {
        isValid = false;
      }
    });
    isFormValid.value = isValid;
    return isValid;
  };

  const resetValidation = () => {
    formErrors.value = {};
    errorMessages.value = {};
    isFormValid.value = false;
  };

  return {
    formErrors,
    errorMessages,
    isFormValid,
    validateField,
    validateForm,
    resetValidation,
  };
};
