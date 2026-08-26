<template>
  <div class="flex flex-col gap-6">
    <section v-if="imageList.length" class="space-y-3">
      <h3 class="text-base font-semibold h-color-lunar-green m-0">{{ t("images") }}</h3>
      <div class="flex flex-wrap gap-3">
        <img
          v-for="(src, index) in imageList"
          :key="`${src}-${index}`"
          :src="resolveProductImageUrl(src)"
          :alt="`${product.title} ${index + 1}`"
          class="w-28 h-28 rounded-lg object-cover border border-gray-200"
        />
      </div>
    </section>

    <section class="space-y-3">
      <h3 class="text-base font-semibold h-color-lunar-green m-0">{{ t("generalSection") }}</h3>
      <dl class="detail-grid">
        <DetailField :label="t('productTitle')" :value="product.title" full-width />
        <DetailField :label="t('description')" :value="product.description" full-width multiline />
        <DetailField :label="t('category')" :value="product.category" />
      </dl>
    </section>

    <section class="space-y-3">
      <h3 class="text-base font-semibold h-color-lunar-green m-0">{{ t("pricingSection") }}</h3>
      <dl class="detail-grid">
        <DetailField :label="t('price')" :value="formatPrice(product.price)" />
        <DetailField
          :label="t('priceBeforeDiscount')"
          :value="product.priceBeforeDiscount != null ? formatPrice(product.priceBeforeDiscount) : null"
        />
        <DetailField
          :label="t('discount')"
          :value="product.discount > 0 ? `${product.discount}%` : null"
        />
      </dl>
    </section>

    <section class="space-y-3">
      <h3 class="text-base font-semibold h-color-lunar-green m-0">{{ t("availabilitySection") }}</h3>
      <dl class="detail-grid">
        <DetailField :label="t('inStock')" :value="formatBool(product.inStock)" />
        <DetailField :label="t('isSet')" :value="formatBool(product.isSet)" />
        <DetailField
          :label="product.isSet ? t('stockQuantitySetLabel') : t('stockQuantityLabel')"
          :value="String(product.stockQuantity ?? 0)"
        />
      </dl>
    </section>

    <section class="space-y-3">
      <h3 class="text-base font-semibold h-color-lunar-green m-0">{{ t("productDetailsSection") }}</h3>
      <dl class="detail-grid">
        <DetailField :label="t('material')" :value="product.material" />
        <DetailField :label="t('capacity')" :value="product.capacity" />
        <DetailField :label="t('dimensions')" :value="product.dimensions" />
      </dl>
    </section>

    <section class="space-y-3">
      <h3 class="text-base font-semibold h-color-lunar-green m-0">{{ t("careSection") }}</h3>
      <dl class="detail-grid">
        <DetailField :label="t('dishwasherSafe')" :value="formatBool(product.dishwasherSafe)" />
        <DetailField :label="t('microwaveSafe')" :value="formatBool(product.microwaveSafe)" />
      </dl>
      <ProductCareLabels :product="product" />
    </section>

    <section class="space-y-3">
      <h3 class="text-base font-semibold h-color-lunar-green m-0">{{ t("storeSection") }}</h3>
      <dl class="detail-grid">
        <DetailField :label="t('popularity')" :value="String(product.popularity ?? 0)" />
        <DetailField :label="t('reviewsCount')" :value="String(product.reviewsCount ?? 0)" />
        <DetailField :label="t('datePublished')" :value="formatDate(product.datePublished)" />
      </dl>
    </section>

    <section class="space-y-3">
      <h3 class="text-base font-semibold h-color-lunar-green m-0">{{ t("adminSection") }}</h3>
      <dl class="detail-grid">
        <DetailField :label="t('productId')" :value="String(product.id)" />
        <DetailField :label="t('artistId')" :value="String(product.artistId)" />
        <DetailField :label="t('artist')" :value="product.artist?.displayName" />
        <DetailField :label="t('artistSlug')" :value="product.artist?.slug" />
        <DetailField :label="t('status')" :value="statusLabel(product.status)" />
        <DetailField
          v-if="product.rejectionReason"
          :label="t('rejectionReason')"
          :value="product.rejectionReason"
          full-width
          multiline
        />
        <DetailField :label="t('reviewedAt')" :value="formatDate(product.reviewedAt)" />
        <DetailField :label="t('createdAt')" :value="formatDate(product.createdAt)" />
        <DetailField :label="t('updatedAt')" :value="formatDate(product.updatedAt)" />
      </dl>
    </section>
  </div>
</template>

<script setup lang="ts">
import type { AdminProduct, ProductStatus } from "~/types/product";
import ProductCareLabels from "~/components/ProductCareLabels.vue";
import DetailField from "~/components/admin/ProductDetailField.vue";
import { getProductImageList } from "~/utils/admin-product";
import { resolveProductImageUrl } from "~/utils/product-image";

const props = defineProps<{
  product: AdminProduct;
}>();

const { t, locale } = useI18n({ useScope: "local" });

const imageList = computed(() => getProductImageList(props.product));

const formatBool = (value: boolean | undefined) =>
  value ? t("yes") : t("no");

const formatPrice = (value: number) => `${value} RON`;

const formatDate = (value: string | null | undefined) => {
  if (!value) return null;
  return new Date(value).toLocaleString(locale.value === "ro" ? "ro-RO" : "en-GB", {
    dateStyle: "medium",
    timeStyle: "short",
  });
};

const statusLabel = (status: ProductStatus) => {
  const map: Record<ProductStatus, string> = {
    DRAFT: t("statusDraft"),
    PENDING_REVIEW: t("statusPendingReview"),
    PENDING_UPDATE_REVIEW: t("statusPendingUpdateReview"),
    PENDING_ARTIST_CONFIRMATION: t("statusPendingConfirmation"),
    APPROVED: t("statusApproved"),
    REJECTED: t("statusRejected"),
  };
  return map[status] ?? status;
};
</script>

<style scoped>
.detail-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 0.75rem 1.5rem;
}

@media (min-width: 640px) {
  .detail-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}
</style>

<i18n lang="json">
{
  "ro": {
    "images": "Imagini",
    "generalSection": "Informații generale",
    "pricingSection": "Preț",
    "availabilitySection": "Disponibilitate",
    "productDetailsSection": "Detalii produs",
    "careSection": "Îngrijire",
    "storeSection": "Magazin",
    "adminSection": "Administrare",
    "productTitle": "Titlu",
    "description": "Descriere",
    "category": "Categorie",
    "price": "Preț",
    "priceBeforeDiscount": "Preț înainte de reducere",
    "discount": "Reducere",
    "inStock": "În stoc",
    "isSet": "Produs tip set",
    "stockQuantityLabel": "Cantitate în stoc",
    "stockQuantitySetLabel": "Cantitate seturi în stoc",
    "material": "Material",
    "capacity": "Capacitate",
    "dimensions": "Dimensiuni",
    "dishwasherSafe": "Mașină de spălat vase",
    "microwaveSafe": "Cuptor cu microunde",
    "popularity": "Popularitate",
    "reviewsCount": "Număr recenzii",
    "datePublished": "Data publicării",
    "productId": "ID produs",
    "artistId": "ID artist",
    "artist": "Artist",
    "artistSlug": "Slug artist",
    "status": "Status",
    "rejectionReason": "Motiv respingere",
    "reviewedAt": "Revizuit la",
    "createdAt": "Creat la",
    "updatedAt": "Actualizat la",
    "yes": "Da",
    "no": "Nu",
    "statusDraft": "Ciornă",
    "statusPendingReview": "De validat",
    "statusPendingUpdateReview": "Modificări de validat",
    "statusPendingConfirmation": "Așteaptă confirmare artist",
    "statusApproved": "Aprobat",
    "statusRejected": "Respins"
  },
  "en": {
    "images": "Images",
    "generalSection": "General information",
    "pricingSection": "Pricing",
    "availabilitySection": "Availability",
    "productDetailsSection": "Product details",
    "careSection": "Care",
    "storeSection": "Store",
    "adminSection": "Administration",
    "productTitle": "Title",
    "description": "Description",
    "category": "Category",
    "price": "Price",
    "priceBeforeDiscount": "Price before discount",
    "discount": "Discount",
    "inStock": "In stock",
    "isSet": "Product is a set",
    "stockQuantityLabel": "Stock quantity",
    "stockQuantitySetLabel": "Number of sets in stock",
    "material": "Material",
    "capacity": "Capacity",
    "dimensions": "Dimensions",
    "dishwasherSafe": "Dishwasher safe",
    "microwaveSafe": "Microwave safe",
    "popularity": "Popularity",
    "reviewsCount": "Reviews count",
    "datePublished": "Published at",
    "productId": "Product ID",
    "artistId": "Artist ID",
    "artist": "Artist",
    "artistSlug": "Artist slug",
    "status": "Status",
    "rejectionReason": "Rejection reason",
    "reviewedAt": "Reviewed at",
    "createdAt": "Created at",
    "updatedAt": "Updated at",
    "yes": "Yes",
    "no": "No",
    "statusDraft": "Draft",
    "statusPendingReview": "Pending review",
    "statusPendingUpdateReview": "Updates pending review",
    "statusPendingConfirmation": "Awaiting artist confirmation",
    "statusApproved": "Approved",
    "statusRejected": "Rejected"
  }
}
</i18n>
