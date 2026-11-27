<template>
  <div class="max-w-4xl mx-auto px-4 py-8">
    <div class="flex items-center gap-3 mb-6">
      <NuxtLink
        :to="localePath('/admin/produse')"
        class="flex items-center justify-center w-9 h-9 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50"
        :aria-label="t('back')"
      >
        <i class="ph ph-arrow-left"></i>
      </NuxtLink>
      <div>
        <h1 class="text-2xl font-bold h-color-lunar-green m-0">{{ t('title') }}</h1>
        <p v-if="product" class="text-sm text-gray-500 m-0 mt-1">{{ product.title }}</p>
      </div>
    </div>

    <div v-if="loading" class="flex justify-center py-16">
      <i class="ph ph-spinner text-4xl animate-spin h-color-primary"></i>
    </div>

    <div v-else-if="product" class="flex flex-col gap-6">
      <div class="flex flex-wrap gap-2 justify-end">
        <Button
          v-if="isSuperAdmin"
          icon="ph ph-pencil-simple"
          :label="t('edit')"
          @click="goToEdit"
        />
      </div>

      <section class="rounded-xl border border-gray-200 bg-white p-5">
        <h2 class="text-lg font-semibold h-color-lunar-green m-0 mb-5">{{ t('summary') }}</h2>
        <ProductDetailsSummary :product="product" />
      </section>

      <section
        v-if="product.pendingProposal"
        class="rounded-xl border border-amber-200 bg-white p-5 space-y-4"
      >
        <div>
          <h2 class="text-lg font-semibold h-color-lunar-green m-0">{{ t('changesTitle') }}</h2>
          <p class="text-sm text-gray-500 m-0 mt-1">
            {{ t('changesCount', { count: changeCount }) }}
          </p>
        </div>
        <ProductChangesReview
          :product="product"
          :changes="product.pendingProposal.changes"
          @updated="reloadProduct"
          @completed="handleReviewCompleted"
        />
      </section>

      <section
        v-else-if="product.status === 'PENDING_REVIEW'"
        class="rounded-xl border border-gray-200 bg-white p-5"
      >
        <h2 class="text-lg font-semibold h-color-lunar-green m-0 mb-4">{{ t('newProductTitle') }}</h2>
        <p class="text-sm text-gray-600 m-0 mb-4">{{ t('newProductHint') }}</p>
        <div class="flex flex-wrap gap-2">
          <Button
            severity="success"
            :label="t('acceptAll')"
            :loading="actionLoading === 'accept-all'"
            @click="reviewAll('accept-all')"
          />
          <Button
            severity="danger"
            :label="t('rejectAll')"
            :loading="actionLoading === 'reject-all'"
            @click="reviewAll('reject-all')"
          />
        </div>
      </section>
    </div>
  </div>
</template>

<script setup>
import Button from 'primevue/button';
import { useToast } from 'primevue/usetoast';
import ProductChangesReview from '~/components/admin/ProductChangesReview.vue';
import ProductDetailsSummary from '~/components/admin/ProductDetailsSummary.vue';
import { countProductChanges } from '~/utils/product-changes';

definePageMeta({
  layout: 'admin',
  middleware: ['auth', 'admin'],
});

const { t, locale } = useI18n({ useScope: 'local' });
const toast = useToast();
const localePath = useLocalePath();
const router = useRouter();
const route = useRoute();
const { getProduct, reviewProductChanges } = useArtist();
const { isSuperAdmin } = useAuth();

const productId = computed(() => Number(route.params.id));
const product = ref(null);
const loading = ref(true);
const actionLoading = ref(null);

const changeCount = computed(() => {
  if (!product.value?.pendingProposal) return 0;
  return countProductChanges(
    product.value,
    product.value.pendingProposal.changes,
    locale.value,
  );
});

async function reloadProduct() {
  product.value = await getProduct(productId.value);
}

function goToEdit() {
  router.push(localePath(`/admin/produse/${productId.value}/editare-admin`));
}

async function handleReviewCompleted() {
  await router.push(localePath('/admin/produse'));
}

async function reviewAll(action) {
  if (action === 'reject-all') {
    const reason = prompt(t('rejectReasonPrompt'));
    if (reason === null) return;
    if (!reason.trim()) {
      toast.add({
        severity: 'warn',
        summary: t('error'),
        detail: t('rejectReasonRequired'),
        life: 3500,
      });
      return;
    }
    actionLoading.value = action;
    try {
      await reviewProductChanges(productId.value, {
        action,
        reason: reason.trim(),
      });
      await handleReviewCompleted();
    } catch (error) {
      toast.add({
        severity: 'error',
        summary: t('error'),
        detail: error.message,
        life: 4000,
      });
    } finally {
      actionLoading.value = null;
    }
    return;
  }

  actionLoading.value = action;
  try {
    await reviewProductChanges(productId.value, { action });
    await handleReviewCompleted();
  } catch (error) {
    toast.add({
      severity: 'error',
      summary: t('error'),
      detail: error.message,
      life: 4000,
    });
  } finally {
    actionLoading.value = null;
  }
}

onMounted(async () => {
  if (!Number.isFinite(productId.value)) {
    await router.replace(localePath('/admin/produse'));
    return;
  }

  try {
    await reloadProduct();
  } catch {
    await router.replace(localePath('/admin/produse'));
  } finally {
    loading.value = false;
  }
});
</script>

<i18n lang="json">
{
  "ro": {
    "title": "Detalii produs",
    "back": "Înapoi",
    "summary": "Date curente",
    "edit": "Editează",
    "changesTitle": "Modificări propuse",
    "changesCount": "{count} modificări de revizuit",
    "newProductTitle": "Produs nou",
    "newProductHint": "Acest produs este nou și așteaptă validarea completă.",
    "acceptAll": "Acceptă produsul",
    "rejectAll": "Respinge produsul",
    "rejectReasonPrompt": "Motiv respingere:",
    "rejectReasonRequired": "Motivul respingerii este obligatoriu",
    "error": "Eroare"
  },
  "en": {
    "title": "Product details",
    "back": "Back",
    "summary": "Current data",
    "edit": "Edit",
    "changesTitle": "Proposed changes",
    "changesCount": "{count} changes to review",
    "newProductTitle": "New product",
    "newProductHint": "This is a new product awaiting full approval.",
    "acceptAll": "Approve product",
    "rejectAll": "Reject product",
    "rejectReasonPrompt": "Rejection reason:",
    "rejectReasonRequired": "Rejection reason is required",
    "error": "Error"
  }
}
</i18n>
