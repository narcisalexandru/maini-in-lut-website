<template>
  <div class="rounded-xl border border-gray-200 p-4 md:p-5 space-y-3">
    <h3 class="text-base font-semibold h-color-lunar-green">{{ t("title") }}</h3>
    <p v-if="loading" class="text-sm text-gray-600 m-0">{{ t("loading") }}</p>
    <p v-else-if="!enabled" class="text-sm text-amber-800 m-0">{{ t("notConfigured") }}</p>
    <template v-else>
      <button
        type="button"
        class="px-4 py-2 rounded-lg border border-[#4f5f42] text-[#3f5134] text-sm font-semibold bg-[#fff9f5] shadow-[0_6px_16px_rgba(79,95,66,0.12)]"
        @click="openMap"
      >
        {{ modelValue ? t("change") : t("choose") }}
      </button>
      <p v-if="modelValue" class="text-sm text-gray-700 m-0">
        <span class="font-semibold">{{ modelValue.name }}</span>
        <span class="block text-xs text-gray-600 mt-1">
          {{ modelValue.address }}, {{ modelValue.city }}, {{ modelValue.county }}, {{ modelValue.postalCode }}
        </span>
      </p>
      <p v-if="loadError" class="text-xs text-red-600 m-0">{{ t("loadError") }}</p>
    </template>
  </div>
</template>

<script setup lang="ts">
export type EasyboxLocker = {
  lockerId: number;
  name: string;
  address: string;
  city: string;
  county: string;
  postalCode: string;
};

type LockerMessage = {
  lockerId?: number;
  name?: string;
  address?: string;
  city?: string;
  county?: string;
  postalCode?: string;
};

type LockerPluginInstance = {
  subscribe: (callback: (message: LockerMessage) => void) => void;
  open: () => void;
  close: () => void;
  reinitializePlugin: (options: Record<string, unknown>) => void;
};

type LockerPluginApi = {
  init: (options: Record<string, unknown>) => void;
  getInstance: () => LockerPluginInstance;
};

defineProps<{
  modelValue: EasyboxLocker | null;
}>();

const emit = defineEmits<{
  "update:modelValue": [value: EasyboxLocker | null];
  configured: [enabled: boolean];
}>();

const { t, locale } = useI18n({ useScope: "local" });
const { getBaseUrl } = useApi();

const loading = ref(true);
const enabled = ref(false);
const loadError = ref(false);
const clientId = ref("");
const apiUsername = ref("");
let pluginReady = false;

function pluginOptions(): Record<string, unknown> {
  return {
    clientId: clientId.value,
    apiUsername: apiUsername.value,
    countryCode: "RO",
    langCode: locale.value === "en" ? "en" : "ro",
    theme: "light",
    filters: [{ showLockers: true }, { showPudos: false }],
  };
}

function lockerApi(): LockerPluginApi | null {
  return (window as Window & { LockerPlugin?: LockerPluginApi }).LockerPlugin ?? null;
}

function loadSdk(): Promise<void> {
  const existing = lockerApi();
  if (existing) {
    return Promise.resolve();
  }
  return new Promise((resolve, reject) => {
    const current = document.querySelector("script[data-sameday-locker]");
    if (current) {
      current.addEventListener("load", () => resolve(), { once: true });
      current.addEventListener("error", () => reject(new Error("sdk")), { once: true });
      return;
    }
    const script = document.createElement("script");
    script.src = "https://cdn.sameday.ro/locker-plugin/lockerpluginsdk.js";
    script.async = true;
    script.dataset.samedayLocker = "true";
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("sdk"));
    document.body.appendChild(script);
  });
}

function onLockerSelected(message: LockerMessage) {
  const lockerId = Number(message.lockerId);
  if (!Number.isInteger(lockerId) || lockerId < 1) {
    return;
  }
  emit("update:modelValue", {
    lockerId,
    name: String(message.name || "").trim(),
    address: String(message.address || "").trim(),
    city: String(message.city || "").trim(),
    county: String(message.county || "").trim(),
    postalCode: String(message.postalCode || "").trim(),
  });
  lockerApi()?.getInstance().close();
}

async function openMap() {
  loadError.value = false;
  try {
    await loadSdk();
    const api = lockerApi();
    if (!api) {
      loadError.value = true;
      return;
    }
    if (!pluginReady) {
      api.init(pluginOptions());
      api.getInstance().subscribe(onLockerSelected);
      pluginReady = true;
    } else {
      api.getInstance().reinitializePlugin(pluginOptions());
    }
    api.getInstance().open();
  } catch {
    loadError.value = true;
  }
}

onMounted(async () => {
  try {
    const config = await $fetch<{
      enabled: boolean;
      clientId: string;
      apiUsername: string;
    }>(`${getBaseUrl()}/checkout/easybox-config`);
    enabled.value = config.enabled;
    clientId.value = config.clientId;
    apiUsername.value = config.apiUsername;
  } catch {
    enabled.value = false;
  } finally {
    loading.value = false;
    emit("configured", enabled.value);
  }
});
</script>

<i18n lang="json">
{
  "ro": {
    "title": "Alege easybox",
    "loading": "Se încarcă harta de lockere...",
    "choose": "Deschide harta Easybox",
    "change": "Schimbă easybox-ul",
    "notConfigured": "Harta Easybox nu este configurată încă. Adaugă credențialele Sameday în setările serverului.",
    "loadError": "Harta Sameday nu a putut fi deschisă. Încearcă din nou."
  },
  "en": {
    "title": "Choose an Easybox",
    "loading": "Loading the locker map...",
    "choose": "Open the Easybox map",
    "change": "Change Easybox",
    "notConfigured": "The Easybox map is not configured yet. Add the Sameday credentials on the server.",
    "loadError": "The Sameday map could not be opened. Try again."
  }
}
</i18n>
