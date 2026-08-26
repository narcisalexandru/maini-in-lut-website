<template>
  <div class="flex flex-col gap-4">
    <div class="flex flex-wrap gap-2">
      <Button
        severity="success"
        icon="ph ph-check"
        :label="t('acceptAll')"
        :loading="loadingAction === 'accept-all'"
        :disabled="!!loadingAction"
        @click="handleAction('accept-all')"
      />
      <Button
        severity="danger"
        icon="ph ph-x"
        :label="t('rejectAll')"
        :loading="loadingAction === 'reject-all'"
        :disabled="!!loadingAction"
        @click="handleAction('reject-all')"
      />
    </div>

    <div
      v-for="item in items"
      :key="item.key"
      class="rounded-lg border border-amber-200 bg-amber-50/50 p-4"
    >
      <div class="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-3">
        <p class="text-sm font-semibold text-gray-800 m-0">{{ item.label }}</p>
        <div class="flex flex-wrap gap-2">
          <Button
            size="small"
            severity="success"
            :label="t('acceptField')"
            :loading="loadingAction === `accept-${item.key}`"
            :disabled="!!loadingAction"
            @click="handleAction('accept-fields', [item.key])"
          />
          <Button
            size="small"
            severity="danger"
            :label="t('rejectField')"
            :loading="loadingAction === `reject-${item.key}`"
            :disabled="!!loadingAction"
            @click="handleAction('reject-fields', [item.key])"
          />
        </div>
      </div>

      <div class="grid grid-cols-1 sm:grid-cols-[1fr_auto_1fr] gap-3 items-start text-sm">
        <div class="rounded-lg bg-red-50 border border-red-100 px-3 py-2.5">
          <span class="block text-[10px] uppercase text-red-500 mb-1">{{ t('before') }}</span>
          <template v-if="item.key === 'images'">
            <div class="flex flex-wrap gap-2">
              <img
                v-for="(src, index) in item.oldImages"
                :key="`old-${index}`"
                :src="resolveProductImageUrl(src)"
                :alt="`${item.label} ${index + 1}`"
                class="w-16 h-16 rounded object-cover border border-red-100"
              />
            </div>
          </template>
          <span v-else class="text-gray-800 break-words whitespace-pre-wrap">{{ item.oldValue }}</span>
        </div>
        <div class="hidden sm:flex items-center justify-center text-amber-700 pt-6">
          <i class="ph ph-arrow-right text-lg"></i>
        </div>
        <div class="rounded-lg bg-green-50 border border-green-100 px-3 py-2.5">
          <span class="block text-[10px] uppercase text-green-600 mb-1">{{ t('after') }}</span>
          <template v-if="item.key === 'images'">
            <div class="flex flex-wrap gap-2">
              <img
                v-for="(src, index) in item.newImages"
                :key="`new-${index}`"
                :src="resolveProductImageUrl(src)"
                :alt="`${item.label} ${index + 1}`"
                class="w-16 h-16 rounded object-cover border border-green-100"
              />
            </div>
          </template>
          <span v-else class="text-gray-900 font-medium break-words whitespace-pre-wrap">{{ item.newValue }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import Button from "primevue/button";
import { useToast } from "primevue/usetoast";
import type { AdminProduct } from "~/types/product";
import { getProductChangeItems } from "~/utils/product-changes";
import { getProductImageList } from "~/utils/admin-product";
import { resolveProductImageUrl } from "~/utils/product-image";

const props = defineProps<{
  product: AdminProduct;
  changes: Partial<AdminProduct> & { images?: string[] };
}>();

const emit = defineEmits<{
  updated: [];
  completed: [];
}>();

const { t } = useI18n({ useScope: "local" });
const { locale } = useI18n();
const toast = useToast();
const { reviewProductChanges } = useArtist();

const loadingAction = ref<string | null>(null);

const items = computed(() => {
  const baseItems = getProductChangeItems(
    props.product,
    props.changes,
    locale.value,
  );

  return baseItems.map((item) => {
    if (item.key !== "images") {
      return { ...item, oldImages: [], newImages: [] };
    }

    const oldImages = getProductImageList(props.product);
    const newImages = props.changes.images?.length
      ? props.changes.images
      : props.changes.image
        ? [props.changes.image]
        : [];

    return { ...item, oldImages, newImages };
  });
});

async function handleAction(
  action: "accept-fields" | "reject-fields" | "accept-all" | "reject-all",
  fields?: string[],
) {
  const actionKey =
    action === "accept-all" || action === "reject-all"
      ? action
      : `${action.split("-")[0]}-${fields?.[0]}`;

  if (action === "reject-all") {
    const reason = prompt(t("rejectReasonPrompt"));
    if (reason === null) return;
    loadingAction.value = actionKey;
    try {
      await reviewProductChanges(props.product.id, {
        action,
        reason: reason.trim() || undefined,
      });
      toast.add({ severity: "success", summary: t("rejectedAll"), life: 3000 });
      emit("completed");
    } catch (error) {
      toast.add({
        severity: "error",
        summary: t("error"),
        detail: error instanceof Error ? error.message : t("error"),
        life: 4000,
      });
    } finally {
      loadingAction.value = null;
    }
    return;
  }

  loadingAction.value = actionKey;
  try {
    const result = await reviewProductChanges(props.product.id, {
      action,
      fields,
    });

    if (action === "accept-all") {
      toast.add({ severity: "success", summary: t("acceptedAll"), life: 3000 });
      emit("completed");
      return;
    }

    if (result.status === "APPROVED" && !result.pendingProposal) {
      toast.add({ severity: "success", summary: t("reviewCompleted"), life: 3000 });
      emit("completed");
      return;
    }

    toast.add({
      severity: "success",
      summary: action === "accept-fields" ? t("acceptedField") : t("rejectedField"),
      life: 3000,
    });
    emit("updated");
  } catch (error) {
    toast.add({
      severity: "error",
      summary: t("error"),
      detail: error instanceof Error ? error.message : t("error"),
      life: 4000,
    });
  } finally {
    loadingAction.value = null;
  }
}
</script>

<i18n lang="json">
{
  "ro": {
    "acceptAll": "Acceptă toate",
    "rejectAll": "Respinge toate",
    "acceptField": "Acceptă",
    "rejectField": "Respinge",
    "before": "Înainte",
    "after": "După",
    "acceptedAll": "Toate modificările au fost acceptate",
    "rejectedAll": "Toate modificările au fost respinse",
    "acceptedField": "Modificarea a fost acceptată",
    "rejectedField": "Modificarea a fost respinsă",
    "reviewCompleted": "Revizuirea modificărilor este finalizată",
    "rejectReasonPrompt": "Motiv respingere (opțional, lasă gol dacă nu aplică):",
    "rejectReasonRequired": "Motivul respingerii este obligatoriu",
    "error": "Eroare"
  },
  "en": {
    "acceptAll": "Accept all",
    "rejectAll": "Reject all",
    "acceptField": "Accept",
    "rejectField": "Reject",
    "before": "Before",
    "after": "After",
    "acceptedAll": "All changes were accepted",
    "rejectedAll": "All changes were rejected",
    "acceptedField": "Change accepted",
    "rejectedField": "Change rejected",
    "reviewCompleted": "Change review completed",
    "rejectReasonPrompt": "Rejection reason (optional):",
    "rejectReasonRequired": "Rejection reason is required",
    "error": "Error"
  }
}
</i18n>
