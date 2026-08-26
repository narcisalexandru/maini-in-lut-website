<template>
  <section class="maini-ui__section">
    <div class="maini-ui__container">
      <h1 class="maini-ui__heading text-left">{{ t("title") }}</h1>
      <div class="h-font-size-16 text-left mb-8">{{ t("sub-title") }}</div>

      <div
        v-if="showSuspensionNotice"
        class="relative mb-8 p-4 md:p-6 rounded-xl border border-red-300 bg-red-50 text-red-900 shadow-sm"
      >
        <button
          type="button"
          class="absolute top-3 right-3 w-8 h-8 flex items-center justify-center rounded-full hover:bg-red-100 transition-colors"
          :aria-label="t('dismissSuspensionNotice')"
          @click="handleDismissSuspensionNotice"
        >
          <i class="ph ph-x text-lg"></i>
        </button>
        <h2 class="font-semibold text-lg pr-10 mb-2">{{ t("suspensionNoticeTitle") }}</h2>
        <p class="text-sm mb-3">{{ t("suspensionNoticeBody") }}</p>
        <p v-if="artistApplication?.suspensionReason" class="text-sm mb-3">
          <span class="font-medium">{{ t("suspensionReasonLabel") }}:</span>
          <span class="whitespace-pre-wrap block mt-1">{{ artistApplication.suspensionReason }}</span>
        </p>
        <NuxtLink
          :to="$localePath('/contact')"
          class="inline-flex items-center gap-1 text-sm font-medium text-red-800 underline hover:text-red-950"
        >
          {{ t("suspensionContactLink") }}
          <i class="ph ph-arrow-right"></i>
        </NuxtLink>
      </div>

      <div
        v-if="showReactivationNotice"
        class="relative mb-8 p-4 md:p-6 rounded-xl border border-green-300 bg-green-50 text-green-900 shadow-sm"
      >
        <button
          type="button"
          class="absolute top-3 right-3 w-8 h-8 flex items-center justify-center rounded-full hover:bg-green-100 transition-colors"
          :aria-label="t('dismissReactivationNotice')"
          @click="handleDismissReactivationNotice"
        >
          <i class="ph ph-x text-lg"></i>
        </button>
        <h2 class="font-semibold text-lg pr-10 mb-2">{{ t("reactivationNoticeTitle") }}</h2>
        <p class="text-sm mb-3">{{ t("reactivationNoticeBody") }}</p>
        <NuxtLink
          :to="$localePath('/admin')"
          class="inline-flex items-center gap-1 text-sm font-medium text-green-800 underline hover:text-green-950"
        >
          {{ t("reactivationPanelLink") }}
          <i class="ph ph-arrow-right"></i>
        </NuxtLink>
      </div>

      <div class="h-bg-white p-4 md:p-8 rounded-xl shadow-md">
        <div class="flex flex-col md:flex-row">
          <div class="flex flex-col items-start md:items-center w-full md:w-1/6 shrink-0 gap-3">
            <nuxt-img
              :src="user.picture"
              :alt="user.name"
              class="w-24 h-24 rounded-full"
            />
            <UserRoleBadge variant="profile" />
          </div>
          <div class="flex flex-col w-full">
            <div class="flex flex-col md:flex-row md:gap-96 w-full">
              <div class="flex flex-col mt-4 md:mt-0">
                <div class="h-font-size-16 h-color-lunar-green">
                  {{ t("first-name") }}
                </div>
                <div class="h-font-size-16">
                  {{ user.first_name }}
                </div>
              </div>
              <div class="flex flex-col mt-4 md:mt-0">
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
                  v-if="
                    user.county && user.city && user.street && user.postal_code
                  "
                  @click="toggleAddressEdit"
                  class="ph ph-note-pencil h-color-lunar-green cursor-pointer hover:text-gray-700 ml-1 items-center"
                />
                <i
                  v-else
                  @click="toggleAddressEdit"
                  class="ph ph-plus h-color-lunar-green cursor-pointer hover:text-gray-700 ml-1 items-center"
                />
              </div>
              <div ref="addressContainer" class="mt-2">
                <div v-if="!isEditingAddress" class="h-font-size-16">
                  {{
                    user.county && user.city && user.street && user.postal_code
                      ? `${user.county}, ${user.city}, ${user.street}, ${user.postal_code}`
                      : t("no-address")
                  }}
                </div>
                <div v-if="isEditingAddress" class="space-y-4">
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
                      () =>
                        validateField('postal_code', addressForm.postal_code)
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
            </div>
            <div class="mt-4">
              <div class="flex items-center">
                <div class="h-color-lunar-green">
                  {{ t("phone") }}
                </div>
                <i
                  v-if="!user.phone"
                  @click="togglePhoneEdit"
                  class="ph ph-plus h-color-lunar-green cursor-pointer hover:text-gray-700 ml-1 items-center"
                />
              </div>
              <div ref="phoneContainer" class="mt-2">
                <div v-if="!isEditingPhone" class="h-font-size-16">
                  {{ user.phone || `${t("no-phone")}` }}
                </div>
                <div v-if="isEditingPhone" class="space-y-4">
                  <FormInput
                    id="phone"
                    name="phone"
                    :label="t('phone')"
                    type="text"
                    v-model="phoneForm.phone"
                    :error="formErrors.phone"
                    :error-message="errorMessages.phone"
                    autocomplete="tel"
                    @blur="() => validateField('phone', phoneForm.phone)"
                  />

                  <div class="flex justify-end space-x-4 mt-4">
                    <Button
                      type="button"
                      class="maini-ui-button__secondary"
                      severity="danger"
                      @click="cancelPhoneEdit"
                    >
                      {{ t("cancel") }}
                    </Button>
                    <Button
                      type="button"
                      class="maini-ui-button__primary"
                      @click="savePhone"
                      :disabled="isLoading"
                    >
                      {{ isLoading ? t("saving") : t("save") }}
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div class="h-bg-white p-4 md:p-8 rounded-xl shadow-md mt-8">
        <h2
          class="h-font-size-18 text-left h-color-palm-leaf h-font-weight-700 mb-4"
        >
          {{ t("orders-histroy") }}
        </h2>
        <div ref="ordersContainer">
          <div v-if="ordersLoading" class="h-color-lunar-green">{{ t("loadingOrders") }}</div>
          <div v-else-if="!orders.length" class="h-color-lunar-green">
            {{ t("noOrders") }}
          </div>
          <NuxtLink
            v-for="order in displayedOrders"
            :key="order.id"
            :to="$localePath(`/profil/comenzi/${order.id}`)"
            class="flex flex-col p-4 border-1 h-border-color-dusty-gray rounded-lg mb-4 hover:bg-gray-50 transition-colors no-underline text-inherit"
          >
            <div class="flex flex-row justify-between items-center">
              <div class="h-font-weight-600">{{ order.publicOrderNumber }}</div>
              <div
                class="flex items-center rounded-xl px-4 py-1 text-sm"
                :class="orderStatusClass(order)"
              >
                {{ formatOrderStatus(order) }}
              </div>
            </div>
            <div class="flex flex-col h-color-lunar-green mt-2">
              <div>{{ formatOrderDate(order.createdAt) }}</div>
              <div>
                {{ order.itemCount }} {{ t("items") }} | {{ order.totalRon.toFixed(2) }} RON
              </div>
              <div
                v-for="artistStatus in order.artistStatuses"
                :key="artistStatus.artistId"
                class="text-sm mt-1"
              >
                {{ artistStatus.artistDisplayName }} — {{ t(`itemStatus.${artistStatus.status}`) }}
              </div>
            </div>
          </NuxtLink>
        </div>
        <div v-if="orders.length > 2" class="flex justify-center mt-4">
          <Button
            type="button"
            class="maini-ui-button__primary"
            @click="showAllOrders = !showAllOrders"
          >
            {{ showAllOrders ? t("show-less") : t("show-more") }}
          </Button>
        </div>
      </div>
      <div v-if="!canAccessAdmin" class="h-bg-white p-4 md:p-8 rounded-xl shadow-md mt-8">
        <h2
          class="h-font-size-18 text-left h-color-palm-leaf h-font-weight-700 mb-2"
        >
          {{ t("sellOnPlatform") }}
        </h2>
        <p class="h-color-lunar-green mb-4">{{ t("sellOnPlatformDesc") }}</p>

        <div v-if="artistApplication?.status === 'PENDING'" class="space-y-3">
          <p class="h-color-lunar-green">{{ t("artistPending") }}</p>
          <p class="text-sm h-color-lunar-green">
            <span class="font-medium">{{ artistApplication.displayName }}</span>
          </p>
        </div>
        <div v-else-if="artistApplication?.status === 'REJECTED'" class="space-y-3">
          <p class="h-color-lunar-green">{{ t("artistRejected") }}</p>
          <p v-if="artistApplication.rejectionReason" class="text-sm text-red-700 whitespace-pre-wrap">
            {{ artistApplication.rejectionReason }}
          </p>
          <NuxtLink :to="$localePath('/vinde-cu-noi?reapply=1')">
            <Button :label="t('reapplyArtist')" class="maini-ui-button__primary mt-2" />
          </NuxtLink>
        </div>
        <div v-else-if="isArtist || artistApplication?.status === 'APPROVED'">
          <NuxtLink :to="$localePath('/admin')">
            <Button :label="t('artistPanel')" class="maini-ui-button__primary" />
          </NuxtLink>
        </div>
        <div v-else>
          <NuxtLink :to="$localePath('/vinde-cu-noi')">
            <Button :label="t('becomeArtist')" class="maini-ui-button__primary" />
          </NuxtLink>
        </div>
      </div>
      <div class="h-bg-white p-4 md:p-8 rounded-xl shadow-md mt-8">
        <div
          class="h-font-size-18 text-left h-color-palm-leaf h-font-weight-700 mb-4"
        >
          {{ t("account-settings") }}
        </div>
        <div class="flex items-start flex-col gap-4">
          <div class="flex flex-col gap-2">
            <div class="h-color-lunar-green">{{ t("logout-message") }}</div>
            <Button
              type="button"
              severity="danger"
              class="w-3xs justify-start"
              @click="handleLogout"
            >
              {{ t("logout-cta") }}
            </Button>
          </div>
          <div class="flex flex-col gap-2">
            <div class="h-color-lunar-green">
              {{ t("delete-account-message") }}
            </div>
            <Button
              type="button"
              severity="danger"
              class="w-3xs justify-start"
              @click="showDeleteAccountDialog"
            >
              {{ t("delete-account-cta") }}
            </Button>
          </div>
        </div>
      </div>
    </div>

    <Dialog
      v-model:visible="deleteAccountDialogVisible"
      modal
      :draggable="false"
      :header="t('delete-account-cta')"
      :style="{ width: '450px' }"
    >
      <div class="flex flex-col gap-4">
        <div class="h-color-lunar-green">
          {{ t("delete-account-confirmation") }}
        </div>
        <div class="flex justify-end gap-2">
          <Button
            type="button"
            severity="secondary"
            @click="deleteAccountDialogVisible = false"
          >
            {{ t("cancel") }}
          </Button>
          <Button type="button" severity="danger" @click="handleDeleteAccount">
            {{ t("delete-account-cta") }}
          </Button>
        </div>
      </div>
    </Dialog>
  </section>
</template>

<script setup>
import { ref, onMounted, computed, nextTick } from "vue";
import { useAuth } from "~/composables/useAuth";
import FormInput from "~/components/FormInput.vue";
import Button from "primevue/button";
import { useFormValidation } from "~/composables/useFormValidation";
import { useToast } from "primevue/usetoast";
import autoAnimate from "@formkit/auto-animate";
import Dialog from "primevue/dialog";
import { normalizeRomanianPhone } from "~/utils/phone";
import { extractApiErrorMessage, formatPhoneApiError } from "~/utils/api-error";

defineI18nRoute({
  paths: {
    ro: "/profil",
    en: "/profile",
  },
});

const { t, locale } = useI18n({
  useScope: "local",
});

const { user, isAuthenticated, checkAuth, loadUser, logout, updateProfile, isArtist, canAccessAdmin } =
  useAuth();
const { getMyOrders } = useOrders();
const { getMyApplication, dismissSuspensionNotice, dismissReactivationNotice } = useArtist();
const isEditingAddress = ref(false);
const isEditingPhone = ref(false);
const isLoading = ref(false);
const toast = useToast();
const { getBaseUrl } = useApi();
const showAllOrders = ref(false);
const addressContainer = ref(null);
const phoneContainer = ref(null);
const ordersContainer = ref(null);
const deleteAccountDialogVisible = ref(false);
const orders = ref([]);
const ordersLoading = ref(true);
const artistApplication = ref(null);

const showSuspensionNotice = computed(
  () =>
    artistApplication.value?.status === "SUSPENDED" &&
    !artistApplication.value?.suspensionNoticeDismissedAt,
);

const showReactivationNotice = computed(
  () =>
    artistApplication.value?.status === "APPROVED" &&
    artistApplication.value?.lastReactivatedAt &&
    !artistApplication.value?.reactivationNoticeDismissedAt,
);

const handleDismissSuspensionNotice = async () => {
  try {
    artistApplication.value = await dismissSuspensionNotice();
  } catch (error) {
    toast.add({
      severity: "error",
      summary: t("error-title"),
      detail: error.message || t("error-dismiss-suspension"),
      life: 4000,
    });
  }
};

const handleDismissReactivationNotice = async () => {
  try {
    artistApplication.value = await dismissReactivationNotice();
  } catch (error) {
    toast.add({
      severity: "error",
      summary: t("error-title"),
      detail: error.message || t("error-dismiss-reactivation"),
      life: 4000,
    });
  }
};

const addressForm = ref({
  county: "",
  city: "",
  street: "",
  postal_code: "",
});

const phoneForm = ref({
  phone: "",
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
  phone: [
    {
      custom: (value) => !!normalizeRomanianPhone(value),
      message: t("phone-must-be-10-digits"),
    },
  ],
};

const { formErrors, errorMessages, validateField, validateForm } =
  useFormValidation(validationRules);

const displayedOrders = computed(() => {
  return showAllOrders.value ? orders.value : orders.value.slice(0, 2);
});

const formatOrderDate = (value) =>
  new Date(value).toLocaleDateString(
    locale.value === "en" ? "en-GB" : "ro-RO",
    { day: "numeric", month: "long", year: "numeric" },
  );

const formatOrderStatus = (order) => {
  if (order.paymentStatus === "PENDING") {
    return t("paymentPending");
  }
  if (order.paymentStatus === "FAILED") {
    return t("paymentFailed");
  }
  const statuses = order.artistStatuses?.map((entry) => entry.status) || [];
  if (statuses.every((status) => status === "DELIVERED")) {
    return t("itemStatus.DELIVERED");
  }
  if (statuses.some((status) => status === "CANCELLED")) {
    return t("itemStatus.CANCELLED");
  }
  return t("itemStatus.PROCESSING");
};

const orderStatusClass = (order) => {
  const label = formatOrderStatus(order);
  if (label === t("itemStatus.DELIVERED")) {
    return "h-bg-aero-blue h-color-castleton-green";
  }
  if (label === t("itemStatus.CANCELLED") || label === t("paymentFailed")) {
    return "bg-red-100 text-red-800";
  }
  return "bg-yellow-100 text-yellow-800";
};

const loadOrders = async () => {
  ordersLoading.value = true;
  try {
    orders.value = await getMyOrders();
  } catch {
    orders.value = [];
  } finally {
    ordersLoading.value = false;
  }
};

const loadArtistApplication = async () => {
  try {
    artistApplication.value = await getMyApplication();
  } catch {
    artistApplication.value = null;
  }
};

onMounted(async () => {
  if (checkAuth()) {
    await loadUser();
    await Promise.all([
      loadOrders(),
      ...(canAccessAdmin.value ? [] : [loadArtistApplication()]),
    ]);
  }

  if (addressContainer.value) {
    autoAnimate(addressContainer.value);
  }
  if (phoneContainer.value) {
    autoAnimate(phoneContainer.value);
  }
  if (ordersContainer.value) {
    autoAnimate(ordersContainer.value);
  }
});

const toggleAddressEdit = async () => {
  try {
    const response = await fetch(
      `${getBaseUrl()}/users/profile/address-status`,
      {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      },
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
      `${getBaseUrl()}/users/profile/address`,
      {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify(addressForm.value),
      },
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

const togglePhoneEdit = () => {
  isEditingPhone.value = true;
  phoneForm.value = {
    phone: user.value.phone || "",
  };
};

const cancelPhoneEdit = () => {
  isEditingPhone.value = false;
  phoneForm.value = {
    phone: "",
  };
};

const savePhone = async () => {
  const normalizedPhone = normalizeRomanianPhone(phoneForm.value.phone);
  if (!normalizedPhone) {
    formErrors.phone = true;
    errorMessages.phone = t("phone-must-be-10-digits");
    return;
  }

  const hasChanges = normalizedPhone !== user.value.phone;

  if (!hasChanges) {
    isEditingPhone.value = false;
    toast.add({
      severity: "info",
      summary: t("no-changes-title"),
      detail: t("no-changes-made"),
      life: 3000,
    });
    return;
  }

  isLoading.value = true;
  try {
    const response = await fetch(
      `${getBaseUrl()}/users/profile/phone`,
      {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify({ phone: normalizedPhone }),
      },
    );

    const result = await response.json().catch(() => ({}));

    if (!response.ok) {
      throw new Error(
        formatPhoneApiError(result, t, {
          "Phone number must be exactly 10 digits": "phone-must-be-10-digits",
          "Phone number is already in use by another user":
            "phone-already-in-use",
        }) ||
          extractApiErrorMessage(result) ||
          t("error-saving-phone"),
      );
    }

    isEditingPhone.value = false;
    try {
      await loadUser();
      toast.add({
        severity: "success",
        summary: t("success-title"),
        detail: t("phone-updated"),
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
  } catch (error) {
    console.error("Error saving phone number:", error);
    const isNetworkError =
      error instanceof TypeError ||
      (error instanceof Error && error.message === "Failed to fetch");
    toast.add({
      severity: "error",
      summary: t("error-title"),
      detail: isNetworkError
        ? t("network-error")
        : error.message || t("error-saving-phone"),
      life: 3000,
    });
  } finally {
    isLoading.value = false;
  }
};

const handleLogout = () => {
  logout();
};

const showDeleteAccountDialog = () => {
  deleteAccountDialogVisible.value = true;
};

const handleDeleteAccount = async () => {
  try {
    const response = await fetch(`${getBaseUrl()}/users/profile`, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
    });

    const result = await response.json();

    if (!response.ok) {
      const errorMessage =
        typeof result.message === "string"
          ? result.message
          : Array.isArray(result.message)
            ? result.message[0]
            : t("error-deleting-account");
      throw new Error(errorMessage);
    }

    deleteAccountDialogVisible.value = false;

    if (result.requiresAdminApproval) {
      toast.add({
        severity: "info",
        summary: t("artist-delete-request-title"),
        detail: t("artist-delete-request-message"),
        life: 8000,
      });
      return;
    }

    toast.add({
      severity: "success",
      summary: t("success-title"),
      detail: t("account-deleted-successfully"),
      life: 3000,
    });
    handleLogout();
  } catch (error) {
    console.error("Error deleting account:", error);
    toast.add({
      severity: "error",
      summary: t("error-title"),
      detail: error.message || t("error-deleting-account"),
      life: 3000,
    });
  }
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
    "error-loading-user-data": "An error occurred while reloading user data",
    "phone-must-be-10-digits": "Phone number must be exactly 10 digits",
    "phone-already-in-use": "This phone number is already used by another account.",
    "phone-required": "Phone number is required",
    "phone-updated": "Phone number updated successfully",
    "error-saving-phone": "An error occurred while saving your phone number",
    "network-error": "Could not reach the server. Check your connection and try again.",
    "orders-histroy": "Orders History",
    "items": "items",
    "show-more": "Show More Orders",
    "show-less": "Show Less Orders",
    "account-settings": "Account Settings",
    "logout-cta": "Logout",
    "logout-message": "Do you want to logout?",
    "delete-account-cta": "Delete Account",
    "delete-account-message": "Once you delete your account, there is no going back. Please be certain.",
    "delete-account-confirmation": "Are you sure you want to delete your account?",
    "error-deleting-account": "An error occurred while deleting your account",
    "artist-delete-request-title": "Deletion request sent",
    "artist-delete-request-message": "We will call you shortly to confirm that you wish to proceed with this action. Thank you for your understanding!",
    "account-deleted-successfully": "Your account has been deleted successfully",
    "suspensionNoticeTitle": "Your artist account has been suspended",
    "suspensionNoticeBody": "Your products are no longer visible on the site and you cannot sell on the platform for now. If you have questions or believe this was a mistake, please contact us.",
    "suspensionReasonLabel": "Reason",
    "suspensionContactLink": "Contact us",
    "dismissSuspensionNotice": "Dismiss notice",
    "error-dismiss-suspension": "Could not dismiss the notice. Please try again.",
    "reactivationNoticeTitle": "Your artist account has been reactivated",
    "reactivationNoticeBody": "You can access the artist panel again and your approved products are visible on the site.",
    "reactivationPanelLink": "Open artist panel",
    "dismissReactivationNotice": "Dismiss notice",
    "error-dismiss-reactivation": "Could not dismiss the notice. Please try again.",
    "sellOnPlatform": "Sell on the platform",
    "sellOnPlatformDesc": "Have handmade products? Join as an artist and reach our customers.",
    "becomeArtist": "Become an artist",
    "artistPanel": "Artist panel",
    "artistPending": "Your artist application is under review.",
    "artistRejected": "Your previous application was rejected. You can submit a new one.",
    "reapplyArtist": "Reapply and edit details",
    "loadingOrders": "Loading orders...",
    "noOrders": "You have no orders yet.",
    "paymentPending": "Awaiting payment",
    "paymentFailed": "Payment failed",
    "itemStatus": {
      "PENDING": "Pending",
      "PROCESSING": "Processing",
      "SHIPPED": "Shipped",
      "DELIVERED": "Delivered",
      "CANCELLED": "Cancelled"
    }
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
    "error-loading-user-data": "A apărut o eroare la reîncărcarea datelor utilizatorului",
    "phone-must-be-10-digits": "Numărul de telefon trebuie să aibă exact 10 cifre",
    "phone-already-in-use": "Acest număr de telefon este deja folosit de alt cont.",
    "phone-required": "Numărul de telefon este obligatoriu",
    "phone-updated": "Numărul de telefon a fost actualizat cu succes",
    "error-saving-phone": "A apărut o eroare la salvarea numărului de telefon",
    "network-error": "Nu am putut contacta serverul. Verifica conexiunea si incearca din nou.",
    "orders-histroy": "Istoricul comenzilor",
    "items": "produse",
    "show-more": "Afișează mai multe comenzi",
    "show-less": "Afișează mai puține comenzi",
    "account-settings": "Setările contului",
    "logout-cta": "Ieșire",
    "logout-message": "Vrei să ieși din cont?",
    "delete-account-cta": "Ștergere cont",
    "delete-account-message": "Odată șters contul, nu mai poți reveni. Te rugăm să fii sigur.",
    "delete-account-confirmation": "Esti sigur ca vrei sa ștergi contul?",
    "error-deleting-account": "A apărut o eroare la ștergerea contului",
    "artist-delete-request-title": "Cerere trimisă",
    "artist-delete-request-message": "O sa revenim cu un apel catre dumneavoastra in cel mai scurt timp, pentru a confirma ca dumneavoastra doriti sa faceti aceasta actiune. Multumim de intelegere !",
    "account-deleted-successfully": "Contul a fost șters cu succes",
    "suspensionNoticeTitle": "Contul tău de artist a fost suspendat",
    "suspensionNoticeBody": "Produsele tale nu mai sunt vizibile pe site și nu poți vinde temporar pe platformă. Dacă ai întrebări sau consideri că această decizie a fost luată din greșeală, ne poți contacta.",
    "suspensionReasonLabel": "Motiv",
    "suspensionContactLink": "Contactează-ne",
    "dismissSuspensionNotice": "Închide notificarea",
    "error-dismiss-suspension": "Notificarea nu a putut fi închisă. Încearcă din nou.",
    "reactivationNoticeTitle": "Contul tău de artist a fost reactivat",
    "reactivationNoticeBody": "Poți accesa din nou panoul de artist, iar produsele tale aprobate sunt vizibile pe site.",
    "reactivationPanelLink": "Deschide panoul artist",
    "dismissReactivationNotice": "Închide notificarea",
    "error-dismiss-reactivation": "Notificarea nu a putut fi închisă. Încearcă din nou.",
    "sellOnPlatform": "Vinde pe platformă",
    "sellOnPlatformDesc": "Ai produse handmade? Înscrie-te ca artist și ajunge la clienții noștri.",
    "becomeArtist": "Devino artist",
    "artistPanel": "Panou artist",
    "artistPending": "Cererea ta de artist este în evaluare.",
    "artistRejected": "Cererea anterioară a fost respinsă. Poți trimite una nouă.",
    "reapplyArtist": "Reaplică și editează datele",
    "loadingOrders": "Se încarcă comenzile...",
    "noOrders": "Nu ai comenzi încă.",
    "paymentPending": "În așteptarea plății",
    "paymentFailed": "Plată eșuată",
    "itemStatus": {
      "PENDING": "În așteptare",
      "PROCESSING": "În procesare",
      "SHIPPED": "Expediat",
      "DELIVERED": "Livrat",
      "CANCELLED": "Anulat"
    }
  }
}
</i18n>
