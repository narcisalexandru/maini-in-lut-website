<template>
  <div class="maini-ui__section md:px-4">
    <ClientOnly>
      <div class="maini-ui__container-products">
        <div
          v-if="cartProducts.length > 0"
          class="mb-8 flex items-center justify-center gap-3"
        >
          <template v-for="step in steps" :key="step.id">
            <button
              type="button"
              class="flex items-center gap-2"
              :class="{ 'opacity-50 cursor-not-allowed': isStepLocked(step.id), 'cursor-pointer': !isStepLocked(step.id) }"
              :disabled="isStepLocked(step.id)"
              @click="navigateToStep(step.id)"
            >
              <span class="step-badge" :class="{ 'step-badge--active': currentStep >= step.id }">{{ step.id }}</span>
              <span class="text-sm text-gray-700">{{ t(step.label) }}</span>
            </button>
            <span v-if="step.id < 3" class="step-line"></span>
          </template>
        </div>

        <div v-if="cartProducts.length === 0" class="py-8">
          <div class="text-center mb-10">
            <i class="ph ph-shopping-cart text-6xl mb-4 opacity-50 h-color-lunar-green"></i>
            <h1 class="text-2xl md:text-3xl font-bold h-color-lunar-green mb-2">{{ t('empty') }}</h1>
            <p class="text-gray-600">{{ t('emptySubtitle') }}</p>
            <NuxtLink :to="$localePath('/produse')" class="inline-flex items-center justify-center gap-2 mt-6 px-6 py-3 rounded-lg text-base font-semibold border border-[#6f825d] text-[#6f825d] hover:bg-[#f4f7f2] transition-colors">
              <i class="ph ph-arrow-left"></i>
              {{ t('continueShopping') }}
            </NuxtLink>
          </div>

          <section v-if="recommendedProducts.length > 0">
            <div class="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-6">
              <div>
                <h2 class="text-2xl font-bold h-color-lunar-green mb-1">{{ t('recommendedTitle') }}</h2>
                <p class="text-gray-600 text-sm">{{ t('recommendedSubtitle') }}</p>
              </div>
              <NuxtLink
                :to="$localePath('/produse')"
                class="text-sm font-semibold uppercase h-color-primary hover:underline"
              >
                {{ t('viewAllCollection') }}
              </NuxtLink>
            </div>
            <div class="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
              <ProductCard
                v-for="product in recommendedProducts"
                :key="product.id"
                :product="product"
              />
            </div>
          </section>
        </div>

        <div v-else class="flex flex-col lg:flex-row gap-8 lg:gap-12">
          <div class="flex-1">
            <h1 class="text-2xl md:text-3xl font-bold h-color-lunar-green mb-6">{{ t(stepTitle) }}</h1>

            <section v-if="currentStep === 1" class="space-y-4">
                <article v-for="item in cartProducts" :key="item.product.id" class="flex flex-col sm:flex-row gap-4 p-4 bg-white rounded-lg shadow-sm border border-gray-100">
                  <NuxtLink :to="$localePath(`/produs/${item.product.id}`)" class="w-full sm:w-24 h-24 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
                    <img :src="getProductPrimaryImageUrl(item.product)" :alt="item.product.title" class="w-full h-full object-cover" />
                  </NuxtLink>
                  <div class="flex-1 min-w-0">
                    <NuxtLink :to="$localePath(`/produs/${item.product.id}`)" class="font-semibold text-gray-800 hover:h-color-primary block">
                      {{ item.product.title }}
                    </NuxtLink>
                    <p class="text-sm text-gray-500 mt-0.5 line-clamp-2">{{ item.product.description }}</p>
                    <div class="mt-3 flex items-center gap-3">
                      <div class="flex items-center border border-gray-300 rounded-lg overflow-hidden">
                        <button type="button" class="w-8 h-8 flex items-center justify-center" :aria-label="t('decreaseQty')" @click="changeCartQuantity(item.product, item.quantity - 1)">
                          <i class="ph ph-minus text-xs"></i>
                        </button>
                        <input :value="item.quantity" type="number" min="1" :max="getMaxCartQuantity(item.product)" class="quantity-input w-10 h-8 text-center border-none" @input="onQuantityInput(item.product, $event)" />
                        <button type="button" class="w-8 h-8 flex items-center justify-center" :disabled="item.quantity >= getMaxCartQuantity(item.product)" :class="{ 'opacity-40 cursor-not-allowed': item.quantity >= getMaxCartQuantity(item.product) }" :aria-label="t('increaseQty')" @click="changeCartQuantity(item.product, item.quantity + 1)">
                          <i class="ph ph-plus text-xs"></i>
                        </button>
                      </div>
                      <button type="button" class="text-sm text-gray-500 hover:text-red-500" @click="removeFromCart(item.product.id)">
                        {{ t('remove') }}
                      </button>
                    </div>
                  </div>
                  <div class="text-right font-semibold h-color-lunar-green">{{ itemLineTotal(item) }} RON</div>
                </article>
              </section>

              <section v-else-if="currentStep === 2" class="space-y-4">
                <template v-if="isLoggedIn">
                  <div class="rounded-xl border border-gray-200 p-4 md:p-5 space-y-4">
                    <div>
                      <h3 class="text-base font-semibold h-color-lunar-green">{{ t('contactDetailsTitle') }}</h3>
                      <p class="text-xs text-gray-600 mt-1">{{ t('contactDetailsHint') }}</p>
                      <p class="text-xs text-amber-700 mt-1 font-medium">{{ t('requiredFieldsNote') }}</p>
                    </div>
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">{{ t('guestFirstName') }} <span class="text-red-600">*</span></label>
                        <input
                          v-model="contactForm.firstName"
                          type="text"
                          :placeholder="t('guestFirstNameExample')"
                          autocomplete="given-name"
                          class="w-full rounded-lg border px-3 py-2"
                          :class="loggedContactInputClass('firstName')"
                          @blur="touchLoggedContactField('firstName')"
                        />
                        <p v-if="showLoggedContactError('firstName')" class="text-xs text-red-600 mt-1">{{ loggedContactFieldError('firstName') }}</p>
                      </div>
                      <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">{{ t('guestLastName') }} <span class="text-red-600">*</span></label>
                        <input
                          v-model="contactForm.lastName"
                          type="text"
                          :placeholder="t('guestLastNameExample')"
                          autocomplete="family-name"
                          class="w-full rounded-lg border px-3 py-2"
                          :class="loggedContactInputClass('lastName')"
                          @blur="touchLoggedContactField('lastName')"
                        />
                        <p v-if="showLoggedContactError('lastName')" class="text-xs text-red-600 mt-1">{{ loggedContactFieldError('lastName') }}</p>
                      </div>
                      <div class="md:col-span-2">
                        <label class="block text-sm font-medium text-gray-700 mb-1">{{ t('guestPhone') }} <span class="text-red-600">*</span></label>
                        <input
                          v-model="contactForm.phone"
                          type="tel"
                          :placeholder="t('guestPhoneExample')"
                          autocomplete="tel"
                          class="w-full rounded-lg border px-3 py-2"
                          :class="loggedContactInputClass('phone')"
                          @blur="touchLoggedContactField('phone')"
                        />
                        <p v-if="showLoggedContactError('phone')" class="text-xs text-red-600 mt-1">{{ loggedContactFieldError('phone') }}</p>
                      </div>
                    </div>
                  </div>

                  <div class="rounded-xl border border-gray-200 p-4 md:p-5 space-y-4">
                    <div class="flex items-center justify-between">
                      <h3 class="text-base font-semibold h-color-lunar-green">{{ t('chooseDeliveryAddress') }}</h3>
                      <button
                        type="button"
                        class="text-sm font-semibold h-color-primary px-3 py-1.5 rounded-md transition-colors hover:bg-[#e3eadb] hover:text-[#4f5f42]"
                        @click="openNewSecondaryAddress"
                      >
                        + {{ t('addNewAddressShort') }}
                      </button>
                    </div>

                    <div class="space-y-3">
                      <button
                        v-for="(addr, idx) in visibleSavedAddressCards"
                        :key="`saved-${idx}`"
                        type="button"
                        class="w-full rounded-lg border px-4 py-3 text-left transition-colors"
                        :class="selectedSavedAddressKey === addr.key ? 'border-[#6f825d] bg-[#f8faf6]' : 'border-gray-200 bg-white hover:border-gray-300'"
                        @click="selectSavedAddress(addr)"
                      >
                        <div class="flex items-center justify-between gap-3">
                          <div class="flex items-start gap-3 min-w-0">
                            <span
                              class="mt-1 inline-flex h-4 w-4 rounded-full border"
                              :class="selectedSavedAddressKey === addr.key ? 'border-[#6f825d]' : 'border-gray-400'"
                            >
                              <span
                                v-if="selectedSavedAddressKey === addr.key"
                                class="m-auto h-2 w-2 rounded-full bg-[#6f825d]"
                              ></span>
                            </span>
                            <div class="min-w-0">
                              <p class="font-semibold text-sm text-gray-800 truncate">{{ addr.title }}</p>
                              <p class="text-xs text-gray-600 mt-0.5 truncate">{{ addr.subtitle }}</p>
                            </div>
                          </div>
                          <div class="flex items-center gap-2">
                            <button
                              type="button"
                              class="text-xs px-4 py-1 rounded-full border border-gray-400 bg-white hover:bg-gray-50"
                              @click.stop="editSavedAddress(addr)"
                            >
                              {{ t('editLabel') }}
                            </button>
                            <button
                              v-if="typeof addr.idx === 'number'"
                              type="button"
                              class="text-xs px-4 py-1 rounded-full border border-red-300 text-red-600 bg-white hover:bg-red-50"
                              @click.stop="requestDeleteSavedAddress(addr)"
                            >
                              {{ t('deleteLabel') }}
                            </button>
                          </div>
                        </div>
                      </button>
                    </div>

                    <button
                      type="button"
                      class="w-full rounded-lg border px-4 py-3 text-left transition-colors"
                      :class="isGiftDelivery ? 'border-[#6f825d] bg-[#f8faf6]' : 'border-gray-200 bg-white hover:border-gray-300'"
                      @click="toggleGiftDelivery"
                    >
                      <span class="flex items-start gap-3">
                        <span
                          class="mt-1 inline-flex h-4 w-4 rounded-full border"
                          :class="isGiftDelivery ? 'border-[#6f825d]' : 'border-gray-400'"
                        >
                          <span
                            v-if="isGiftDelivery"
                            class="m-auto h-2 w-2 rounded-full bg-[#6f825d]"
                          ></span>
                        </span>
                        <span class="min-w-0">
                          <span class="block text-sm font-semibold text-gray-800">{{ t('giftCheckboxLabel') }}</span>
                          <span class="block text-xs text-gray-600 mt-0.5">{{ t('addressModeGift') }}</span>
                        </span>
                      </span>
                    </button>
                  </div>

                  <div v-if="loggedAddressMode === 'newSecondary'" class="rounded-xl border border-gray-200 p-4 md:p-5 space-y-4">
                    <p class="text-xs text-amber-700 font-medium">{{ t('requiredFieldsNote') }}</p>
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div class="md:col-span-2">
                      <label class="block text-sm font-medium text-gray-700 mb-1">{{ t('secondaryLabel') }}</label>
                      <input
                        v-model="newSecondaryForm.label"
                        type="text"
                        :placeholder="t('secondaryLabel')"
                        class="w-full rounded-lg border px-3 py-2"
                        @input="markAddressDirty"
                      />
                    </div>
                    <div>
                      <label class="block text-sm font-medium text-gray-700 mb-1">{{ t('guestStreet') }} <span class="text-red-600">*</span></label>
                      <input v-model="newSecondaryForm.street" type="text" :placeholder="t('guestStreetExample')" class="w-full rounded-lg border px-3 py-2" @input="markAddressDirty" />
                    </div>
                    <div>
                      <label class="block text-sm font-medium text-gray-700 mb-1">{{ t('guestCity') }} <span class="text-red-600">*</span></label>
                      <input v-model="newSecondaryForm.city" type="text" :placeholder="t('guestCityExample')" class="w-full rounded-lg border px-3 py-2" @input="markAddressDirty" />
                    </div>
                    <div>
                      <label class="block text-sm font-medium text-gray-700 mb-1">{{ t('guestCounty') }} <span class="text-red-600">*</span></label>
                      <input v-model="newSecondaryForm.county" type="text" :placeholder="t('guestCountyExample')" class="w-full rounded-lg border px-3 py-2" @input="markAddressDirty" />
                    </div>
                    <div>
                      <label class="block text-sm font-medium text-gray-700 mb-1">{{ t('guestPostalCode') }} <span class="text-red-600">*</span></label>
                      <input v-model="newSecondaryForm.postalCode" type="text" :placeholder="t('guestPostalCodeExample')" class="w-full rounded-lg border px-3 py-2" @input="markAddressDirty" />
                    </div>
                    <label class="text-sm md:col-span-2 flex items-center gap-2" :class="!canSaveAsSecondaryAddress ? 'opacity-60' : ''">
                      <input v-model="saveAsSecondary" type="checkbox" :disabled="!canSaveAsSecondaryAddress" @change="markAddressDirty" />
                      <span>{{ t('saveAsSecondary') }}</span>
                    </label>
                    <p v-if="!canSaveAsSecondaryAddress" class="text-xs text-amber-700 md:col-span-2">
                      {{ t('savedAddressLimitReached') }}
                    </p>
                    <p v-if="!canSaveAsSecondaryAddress" class="text-xs text-gray-600 md:col-span-2 -mt-2">
                      {{ t('addressUsedOnlyForOrder') }}
                    </p>
                    <div class="md:col-span-2 flex items-center gap-3">
                      <button
                        type="button"
                        class="px-4 py-2 rounded-lg border border-[#6f825d] text-[#6f825d] text-sm font-semibold hover:bg-[#f8faf6]"
                        :disabled="addressSaving"
                        @click="saveAddressFromForm"
                      >
                        {{ addressSaving ? t('savingAddress') : t('saveAddressBtn') }}
                      </button>
                      <span v-if="addressSaved" class="text-xs text-green-700">{{ t('addressSavedMsg') }}</span>
                    </div>
                    </div>
                  </div>

                  <div v-if="loggedAddressMode === 'gift'" class="rounded-xl border border-gray-200 p-4 md:p-5 grid grid-cols-1 md:grid-cols-2 gap-4">
                    <input v-model="giftForm.recipientFirstName" type="text" :placeholder="t('giftRecipientFirstName')" class="w-full rounded-lg border px-3 py-2" />
                    <input v-model="giftForm.recipientLastName" type="text" :placeholder="t('giftRecipientLastName')" class="w-full rounded-lg border px-3 py-2" />
                    <input v-model="giftForm.recipientPhone" type="text" :placeholder="t('guestPhoneExample')" class="w-full rounded-lg border px-3 py-2 md:col-span-2" />
                    <input v-model="giftForm.street" type="text" :placeholder="t('guestStreetExample')" class="w-full rounded-lg border px-3 py-2" />
                    <input v-model="giftForm.city" type="text" :placeholder="t('guestCityExample')" class="w-full rounded-lg border px-3 py-2" />
                    <input v-model="giftForm.county" type="text" :placeholder="t('guestCountyExample')" class="w-full rounded-lg border px-3 py-2" />
                    <input v-model="giftForm.postalCode" type="text" :placeholder="t('guestPostalCodeExample')" class="w-full rounded-lg border px-3 py-2" />
                  </div>

                  <div class="rounded-xl border border-gray-200 p-4 md:p-5">
                    <h3 class="text-base font-semibold h-color-lunar-green mb-2">{{ t('billingDataTitle') }}</h3>
                    <label class="flex items-start gap-3 mb-3 cursor-pointer">
                      <input v-model="useDifferentBilling" type="checkbox" class="mt-1 shrink-0" />
                      <span class="text-sm text-gray-700">{{ t('useDifferentBilling') }}</span>
                    </label>
                    <p v-if="!useDifferentBilling" class="text-sm text-gray-600 rounded-lg bg-gray-50 border border-gray-100 px-3 py-2">
                      {{ t('billingSameAsDelivery') }}
                    </p>
                    <div v-else class="space-y-3">
                      <div class="inline-flex rounded-lg border border-gray-300 p-1">
                        <button
                          type="button"
                          class="px-3 py-1.5 text-sm rounded-md"
                          :class="billingType === 'individual' ? 'bg-[#6f825d] text-white' : 'text-gray-700'"
                          @click="billingType = 'individual'"
                        >
                          {{ t('billingIndividual') }}
                        </button>
                        <button
                          type="button"
                          class="px-3 py-1.5 text-sm rounded-md"
                          :class="billingType === 'company' ? 'bg-[#6f825d] text-white' : 'text-gray-700'"
                          @click="billingType = 'company'"
                        >
                          {{ t('billingCompany') }}
                        </button>
                      </div>

                      <div v-if="billingType === 'company'" class="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div class="md:col-span-2 flex gap-2">
                          <input v-model="billingForm.cui" type="text" :placeholder="t('billingCui')" class="w-full rounded-lg border border-gray-300 px-3 py-2" @keydown.enter.prevent="lookupCompanyByCui" />
                          <button type="button" class="px-3 py-2 rounded-lg border border-gray-300 text-sm" :disabled="billingLookupLoading" @click="lookupCompanyByCui">
                            {{ billingLookupLoading ? t('loadingCompanyData') : t('loadCompanyData') }}
                          </button>
                        </div>
                        <p v-if="billingLookupError" class="md:col-span-2 text-xs text-red-600">{{ billingLookupError }}</p>
                        <input v-model="billingForm.companyName" type="text" :placeholder="t('billingCompanyName')" class="w-full rounded-lg border border-gray-300 px-3 py-2 md:col-span-2" />
                        <input v-model="billingForm.tradeRegister" type="text" :placeholder="t('billingTradeRegister')" class="w-full rounded-lg border border-gray-300 px-3 py-2 md:col-span-2" />
                        <input v-model="billingForm.street" type="text" :placeholder="t('guestStreet')" class="w-full rounded-lg border border-gray-300 px-3 py-2 md:col-span-2" />
                      </div>

                      <div v-else class="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div>
                          <label class="block text-sm font-medium text-gray-700 mb-1">{{ t('guestFirstName') }} <span class="text-red-600">*</span></label>
                          <input v-model="billingForm.firstName" type="text" :placeholder="t('guestFirstName')" class="w-full rounded-lg border border-gray-300 px-3 py-2" />
                        </div>
                        <div>
                          <label class="block text-sm font-medium text-gray-700 mb-1">{{ t('guestLastName') }} <span class="text-red-600">*</span></label>
                          <input v-model="billingForm.lastName" type="text" :placeholder="t('guestLastName')" class="w-full rounded-lg border border-gray-300 px-3 py-2" />
                        </div>
                        <div>
                          <label class="block text-sm font-medium text-gray-700 mb-1">{{ t('guestEmail') }} <span class="text-red-600">*</span></label>
                          <input v-model="billingForm.email" type="email" :placeholder="t('guestEmail')" class="w-full rounded-lg border border-gray-300 px-3 py-2" />
                        </div>
                        <div>
                          <label class="block text-sm font-medium text-gray-700 mb-1">{{ t('guestPhone') }} <span class="text-red-600">*</span></label>
                          <input v-model="billingForm.phone" type="text" :placeholder="t('guestPhone')" class="w-full rounded-lg border border-gray-300 px-3 py-2" />
                        </div>
                        <div class="md:col-span-2">
                          <label class="block text-sm font-medium text-gray-700 mb-1">{{ t('guestStreet') }} <span class="text-red-600">*</span></label>
                          <input v-model="billingForm.street" type="text" :placeholder="t('guestStreet')" class="w-full rounded-lg border border-gray-300 px-3 py-2" />
                        </div>
                        <div>
                          <label class="block text-sm font-medium text-gray-700 mb-1">{{ t('guestCity') }} <span class="text-red-600">*</span></label>
                          <input v-model="billingForm.city" type="text" :placeholder="t('guestCity')" class="w-full rounded-lg border border-gray-300 px-3 py-2" />
                        </div>
                        <div>
                          <label class="block text-sm font-medium text-gray-700 mb-1">{{ t('guestCounty') }} <span class="text-red-600">*</span></label>
                          <input v-model="billingForm.county" type="text" :placeholder="t('guestCounty')" class="w-full rounded-lg border border-gray-300 px-3 py-2" />
                        </div>
                        <div>
                          <label class="block text-sm font-medium text-gray-700 mb-1">{{ t('guestPostalCode') }} <span class="text-red-600">*</span></label>
                          <input v-model="billingForm.postalCode" type="text" :placeholder="t('guestPostalCode')" class="w-full rounded-lg border border-gray-300 px-3 py-2" />
                        </div>
                      </div>
                    </div>
                  </div>
                </template>

                <template v-else>
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div v-for="field in deliveryFields" :key="field.name">
                    <label class="block text-sm text-gray-700 mb-1">{{ t(field.label) }} *</label>
                    <input
                      :id="field.name"
                      :name="field.name"
                      v-model="guestForm[field.name]"
                      :type="field.type || 'text'"
                      :placeholder="t(field.placeholder)"
                      :autocomplete="field.autocomplete"
                      class="w-full rounded-lg border px-3 py-2"
                      :class="guestInputClass(field.name)"
                      @blur="touchGuestField(field.name)"
                    />
                    <p v-if="showGuestFieldError(field.name)" class="text-xs text-red-600 mt-1">{{ guestFieldError(field.name) }}</p>
                  </div>
                </div>
                </template>
              </section>

              <section v-else class="space-y-4">
                <div class="rounded-lg border border-gray-200 p-4">
                  <label class="flex items-start gap-3">
                    <input v-model="payOnline" type="radio" :value="true" name="payment" />
                    <span class="text-sm"><strong>{{ t('payOnline') }}</strong><br />{{ t('payOnlineHint') }}</span>
                  </label>
                </div>
                <div class="rounded-lg border border-gray-200 p-4">
                  <label class="flex items-start gap-3">
                    <input v-model="payOnline" type="radio" :value="false" name="payment" />
                    <span class="text-sm"><strong>{{ t('payOnDelivery') }}</strong><br />{{ t('payOnDeliveryHint') }}</span>
                  </label>
                </div>
                <label class="flex items-start gap-2 pt-2 text-sm text-gray-700">
                  <input v-model="termsAccepted" type="checkbox" class="mt-1 shrink-0" @blur="termsTouched = true" />
                  <span>
                    {{ t('guestTermsPrefix') }}
                    <NuxtLink
                      :to="localePath({ name: 'terms-and-conditions', query: { step: '3' } })"
                      class="underline h-color-palm-leaf hover:h-color-primary"
                      @click.stop
                    >{{ t('guestTermsLink') }}</NuxtLink>.
                    *
                  </span>
                </label>
                <p v-if="showTermsError" class="text-xs text-red-600">{{ t('guestTermsRequired') }}</p>
              </section>
          </div>

          <aside class="lg:w-92 flex-shrink-0 min-w-0">
            <div class="bg-white rounded-lg shadow-sm border border-gray-100 p-6 sticky top-4">
              <h2 class="text-3xl font-semibold h-color-lunar-green mb-4">{{ t('summaryTitle') }}</h2>
              <div class="space-y-3 mb-4 border-b border-gray-100 pb-4">
                <div v-for="item in cartProducts" :key="`summary-${item.product.id}`" class="flex items-center gap-3">
                  <img :src="getProductPrimaryImageUrl(item.product)" :alt="item.product.title" class="w-14 h-14 rounded-md object-cover bg-gray-100" />
                  <div class="min-w-0 flex-1">
                    <p class="text-sm font-medium truncate">{{ item.product.title }}</p>
                    <p class="text-xs text-gray-500">{{ t('qty') }}: {{ item.quantity }}</p>
                  </div>
                  <p class="text-sm font-medium">{{ itemLineTotal(item) }} RON</p>
                </div>
              </div>

              <dl class="space-y-2 mb-4">
                <div class="flex justify-between text-gray-600"><dt>{{ t('subtotal') }}</dt><dd>{{ subtotal }} RON</dd></div>
                <div class="flex justify-between text-gray-600"><dt>{{ t('delivery') }}</dt><dd>{{ deliveryFee }} RON</dd></div>
                <div v-if="cashOperationalFee > 0" class="flex justify-between text-gray-600"><dt>{{ t('cashOperationalFee') }}</dt><dd>{{ cashOperationalFee }} RON</dd></div>
                <div class="flex justify-between text-xl font-bold h-color-lunar-green pt-2 border-t border-gray-200"><dt>{{ t('total') }}</dt><dd>{{ total }} RON</dd></div>
              </dl>

              <div class="flex gap-2 mb-4">
                <input v-model="promoCode" type="text" :placeholder="t('promoPlaceholder')" class="w-full px-3 py-2 border border-gray-300 rounded-lg" />
                <button type="button" class="px-4 py-2 rounded-lg border border-gray-300 text-sm font-medium">{{ t('promoApply') }}</button>
              </div>

              <button v-if="currentStep === 1" type="button" class="maini-ui-button__buy w-full rounded-lg text-base font-bold" style="height: 52px; min-height: 52px;" @click="goToDeliveryStep">{{ t('goToDelivery') }}</button>
              <button v-else-if="currentStep === 2" type="button" class="maini-ui-button__buy w-full rounded-lg text-base font-bold" style="height: 52px; min-height: 52px;" @click="goToPaymentStep">{{ t('goToPayment') }}</button>
              <button v-else type="button" class="maini-ui-button__buy w-full rounded-lg text-base font-bold flex items-center justify-center gap-2" style="height: 52px; min-height: 52px;" :disabled="checkoutLoading" @click="goToCheckout">
                <i v-if="checkoutLoading" class="ph ph-spinner text-xl animate-spin"></i>
                <i v-else class="ph ph-credit-card"></i>
                {{ checkoutButtonLabel }}
              </button>

              <button v-if="currentStep > 1" type="button" class="mt-2 w-full rounded-md border border-gray-300 text-xs text-gray-700" style="height: 30px; min-height: 30px;" @click="currentStep -= 1">{{ t('back') }}</button>
              <p v-if="checkoutError" class="text-sm text-red-600 mt-2">{{ checkoutError }}</p>
              <p class="text-xs text-gray-500 mt-3 text-center">{{ t('securePayment') }}</p>
            </div>
          </aside>
        </div>
      </div>

      <div
        v-if="showDeleteAddressModal"
        class="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4"
        @click.self="closeDeleteAddressModal"
      >
        <div class="w-full max-w-md rounded-xl bg-white p-5 shadow-xl border border-gray-200">
          <h3 class="text-lg font-semibold text-gray-900">{{ t('confirmDeleteAddressTitle') }}</h3>
          <p class="text-sm text-gray-600 mt-2">{{ t('confirmDeleteAddressDescription') }}</p>
          <div class="mt-4 rounded-lg border border-gray-200 bg-gray-50 p-3 text-sm text-gray-700">
            <p v-if="pendingDeleteAddress?.label" class="font-semibold mb-1">{{ pendingDeleteAddress.label }}</p>
            <p>{{ pendingDeleteAddress?.street }}, {{ pendingDeleteAddress?.city }}</p>
            <p>{{ pendingDeleteAddress?.county }}, {{ pendingDeleteAddress?.postal_code }}</p>
          </div>
          <div class="mt-5 flex items-center justify-end gap-2">
            <button
              type="button"
              class="px-4 py-2 rounded-lg border border-gray-300 text-sm text-gray-700 hover:bg-gray-50"
              @click="closeDeleteAddressModal"
            >
              {{ t('cancelDeleteAddress') }}
            </button>
            <button
              type="button"
              class="px-4 py-2 rounded-lg border border-red-300 bg-red-50 text-sm font-semibold text-red-700 hover:bg-red-100"
              @click="deleteSavedAddress"
            >
              {{ t('confirmDeleteAddress') }}
            </button>
          </div>
        </div>
      </div>

      <template #fallback>
        <div class="maini-ui__container-products py-12 flex justify-center">
          <i class="ph ph-spinner text-4xl animate-spin h-color-primary"></i>
        </div>
      </template>
    </ClientOnly>
  </div>
</template>

<script setup>
import { normalizeRomanianPhone } from '~/utils/phone';
import { extractApiErrorMessage, formatPhoneApiError } from '~/utils/api-error';
import { syncStoredUserProfile } from '~/utils/sync-user-profile';
import { getOrCreateGuestCartId, buildGuestCartHeaders } from '~/utils/guest-cart-id';
import { getProductStockQuantity } from '~/utils/product-stock';
import { getProductPrimaryImageUrl } from '~/utils/product-image';
defineI18nRoute({ paths: { ro: '/cos', en: '/cart' } });
const { t } = useI18n({ useScope: 'local' });
const { cartItems, setQuantity, removeFromCart, clearCart, refreshGuestReservations } = useCart();
const { getBaseUrl } = useApi();
const localePath = useLocalePath();
const router = useRouter();
const route = useRoute();
const allProducts = ref([]);
const promoCode = ref('');
const checkoutLoading = ref(false);
const checkoutError = ref('');
const isLoggedIn = ref(false);
const currentStep = ref(1);
const payOnline = ref(true);
const termsAccepted = ref(false);
const termsTouched = ref(false);
const guestSubmitAttempted = ref(false);
const loggedAddressMode = ref('primary');
const secondaryAddresses = ref([]);
const selectedSecondaryIndex = ref(-1);
const primaryAddress = ref(null);
const customerFullName = ref('');
const savedProfilePhone = ref('');
const saveAsSecondary = ref(true);
const addressSaving = ref(false);
const addressSaved = ref(false);
const isGiftDelivery = ref(false);
const billingType = ref('individual');
const useDifferentBilling = ref(false);
const billingLookupLoading = ref(false);
const billingLookupError = ref('');
const editAddressTarget = ref({ type: '', index: -1 });
const showDeleteAddressModal = ref(false);
const pendingDeleteAddress = ref(null);
const newSecondaryForm = ref({
  label: '',
  county: '',
  city: '',
  street: '',
  postalCode: '',
});
const giftForm = ref({
  recipientFirstName: '',
  recipientLastName: '',
  recipientPhone: '',
  county: '',
  city: '',
  street: '',
  postalCode: '',
});
const billingForm = ref({
  firstName: '',
  lastName: '',
  email: '',
  phone: '',
  companyName: '',
  cui: '',
  tradeRegister: '',
  county: '',
  city: '',
  street: '',
  postalCode: '',
});
const contactForm = ref({ firstName: '', lastName: '', phone: '' });
const loggedContactTouched = ref({ firstName: false, lastName: false, phone: false });
const loggedSubmitAttempted = ref(false);
const steps = [{ id: 1, label: 'steps.cart' }, { id: 2, label: 'steps.delivery' }, { id: 3, label: 'steps.payment' }];
const deliveryFields = [
  { name: 'firstName', label: 'guestFirstName', placeholder: 'guestFirstNameExample', autocomplete: 'given-name' },
  { name: 'lastName', label: 'guestLastName', placeholder: 'guestLastNameExample', autocomplete: 'family-name' },
  { name: 'email', label: 'guestEmail', placeholder: 'guestEmailExample', type: 'email', autocomplete: 'email' },
  { name: 'phone', label: 'guestPhone', placeholder: 'guestPhoneExample', autocomplete: 'tel' },
  { name: 'street', label: 'guestStreet', placeholder: 'guestStreetExample', autocomplete: 'street-address' },
  { name: 'county', label: 'guestCounty', placeholder: 'guestCountyExample', autocomplete: 'address-level1' },
  { name: 'city', label: 'guestCity', placeholder: 'guestCityExample', autocomplete: 'address-level2' },
  { name: 'postalCode', label: 'guestPostalCode', placeholder: 'guestPostalCodeExample', autocomplete: 'postal-code' },
];
const guestForm = ref({ firstName: '', lastName: '', email: '', phone: '', county: '', city: '', street: '', postalCode: '' });
const guestTouched = ref({ firstName: false, lastName: false, email: false, phone: false, county: false, city: false, street: false, postalCode: false });
const cartProducts = computed(() => {
  const products = allProducts.value;
  return cartItems.value.map((item) => {
    const product = products.find((p) => p.id === item.productId);
    return product ? { product, quantity: item.quantity } : null;
  }).filter(Boolean);
});
const recommendedProducts = computed(() => {
  const cartIds = new Set(cartItems.value.map((item) => item.productId));
  return allProducts.value.filter((product) => !cartIds.has(product.id)).slice(0, 4);
});
const subtotal = computed(() => cartProducts.value.reduce((sum, { product, quantity }) => sum + Number(product.price) * quantity, 0));
const deliveryFee = computed(() => 15);
const cashOperationalFee = computed(() => (payOnline.value ? 0 : 5));
const total = computed(() => subtotal.value + deliveryFee.value + cashOperationalFee.value);
const checkoutButtonLabel = computed(() => (payOnline.value ? t('checkout') : t('checkoutCash')));
const stepTitle = computed(() => (currentStep.value === 1 ? 'title' : currentStep.value === 2 ? 'deliveryTitle' : 'paymentTitle'));
function getMaxCartQuantity(product) {
  return getProductStockQuantity(product);
}
function changeCartQuantity(product, newQty) {
  const max = getMaxCartQuantity(product);
  setQuantity(product.id, newQty, max);
}
function clampCartQuantitiesToStock() {
  for (const item of cartItems.value) {
    const product = allProducts.value.find((p) => p.id === item.productId);
    if (!product) continue;
    const max = getMaxCartQuantity(product);
    if (item.quantity > max) {
      setQuantity(product.id, max, max);
    }
  }
}
function itemLineTotal({ product, quantity }) { return (Number(product.price) * quantity).toFixed(0); }
function onQuantityInput(product, e) {
  const qty = parseInt(e?.target?.value, 10);
  changeCartQuantity(product, Number.isFinite(qty) && qty >= 1 ? qty : 1);
}
function touchGuestField(field) { if (guestTouched.value[field] !== undefined) guestTouched.value[field] = true; }
function validateGuestField(field, value) {
  const trimmed = String(value || '').trim();
  if (!trimmed) return 'required';
  if (field === 'email') return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed) ? '' : 'invalidEmail';
  if (field === 'phone') return normalizeRomanianPhone(trimmed) ? '' : 'invalidPhone';
  if (field === 'postalCode') return /^[0-9]{6}$/.test(trimmed) ? '' : 'invalidPostalCode';
  if (field === 'firstName' || field === 'lastName') return /^[a-zA-Z\s-]{2,}$/.test(trimmed) ? '' : 'invalidName';
  if (field === 'county' || field === 'city') return /^[a-zA-Z\s.-]{2,}$/.test(trimmed) ? '' : 'invalidLocation';
  if (field === 'street') return trimmed.length >= 5 ? '' : 'invalidStreet';
  return '';
}
function guestFieldError(field) {
  const code = validateGuestField(field, guestForm.value[field]);
  if (!code) return '';
  const keyMap = { required: 'guestValidationRequired', invalidEmail: 'guestValidationInvalidEmail', invalidPhone: 'guestValidationInvalidPhone', invalidPostalCode: 'guestValidationInvalidPostalCode', invalidName: 'guestValidationInvalidName', invalidLocation: 'guestValidationInvalidLocation', invalidStreet: 'guestValidationInvalidStreet' };
  return t(keyMap[code]);
}
function showGuestFieldError(field) { return (guestTouched.value[field] || guestSubmitAttempted.value) && !!guestFieldError(field); }
function guestInputClass(field) { return showGuestFieldError(field) ? 'border-red-500 focus:border-red-500' : 'border-gray-300'; }
function touchLoggedContactField(field) { if (loggedContactTouched.value[field] !== undefined) loggedContactTouched.value[field] = true; }
function loggedContactFieldError(field) {
  const code = validateGuestField(field, contactForm.value[field]);
  if (!code) return '';
  const keyMap = { required: 'guestValidationRequired', invalidEmail: 'guestValidationInvalidEmail', invalidPhone: 'guestValidationInvalidPhone', invalidPostalCode: 'guestValidationInvalidPostalCode', invalidName: 'guestValidationInvalidName', invalidLocation: 'guestValidationInvalidLocation', invalidStreet: 'guestValidationInvalidStreet' };
  return t(keyMap[code]);
}
function showLoggedContactError(field) {
  const code = validateGuestField(field, contactForm.value[field]);
  if (!code) return false;
  return loggedContactTouched.value[field] || loggedSubmitAttempted.value;
}
function loggedContactInputClass(field) {
  return showLoggedContactError(field) ? 'border-red-500 focus:border-red-500' : 'border-gray-300';
}
function isLoggedContactValid() {
  return ['firstName', 'lastName', 'phone'].every((field) => !validateGuestField(field, contactForm.value[field]));
}
const loggedContactValid = computed(() => isLoggedContactValid());
const hasGuestFormErrors = computed(() => Object.keys(guestForm.value).some((field) => !!validateGuestField(field, guestForm.value[field])));
const showTermsError = computed(() => (termsTouched.value || guestSubmitAttempted.value) && !termsAccepted.value);
const canPlaceOrder = computed(() => (isLoggedIn.value ? termsAccepted.value : termsAccepted.value && !hasGuestFormErrors.value));
function buildBillingFromDelivery() {
  const addr = selectedDeliveryAddress.value;
  const billingSource =
    isLoggedIn.value && isGiftDelivery.value
      ? getPrimaryAddressForBilling()
      : addr;
  return {
    type: 'individual',
    firstName: contactForm.value.firstName,
    lastName: contactForm.value.lastName,
    email: billingForm.value.email,
    phone: normalizeRomanianPhone(contactForm.value.phone) || contactForm.value.phone,
    street: billingSource?.street || '',
    city: billingSource?.city || '',
    county: billingSource?.county || '',
    postalCode: billingSource?.postalCode || '',
    companyName: '',
    cui: '',
    tradeRegister: '',
  };
}
const billingDetailsPayload = computed(() => {
  if (isLoggedIn.value && !useDifferentBilling.value) {
    return buildBillingFromDelivery();
  }
  return {
    type: billingType.value,
    ...billingForm.value,
    phone: normalizeRomanianPhone(billingForm.value.phone) || billingForm.value.phone,
  };
});
const selectedDeliveryAddress = computed(() => {
  const recipientName = `${contactForm.value.firstName} ${contactForm.value.lastName}`.trim();
  const recipientPhone = normalizeRomanianPhone(contactForm.value.phone);
  if (!isLoggedIn.value) return null;
  if (loggedAddressMode.value === 'primary') {
    return primaryAddress.value
      ? {
          county: primaryAddress.value.county,
          city: primaryAddress.value.city,
          street: primaryAddress.value.street,
          postalCode: primaryAddress.value.postal_code,
          recipientName,
          recipientPhone,
        }
      : null;
  }
  if (loggedAddressMode.value === 'secondary') {
    const addr = secondaryAddresses.value[selectedSecondaryIndex.value];
    return addr
      ? {
          label: addr.label,
          county: addr.county,
          city: addr.city,
          street: addr.street,
          postalCode: addr.postal_code,
          recipientName,
          recipientPhone,
        }
      : null;
  }
  if (loggedAddressMode.value === 'newSecondary') {
    return newSecondaryForm.value.county &&
      newSecondaryForm.value.city &&
      newSecondaryForm.value.street &&
      newSecondaryForm.value.postalCode
      ? {
          label: newSecondaryForm.value.label,
          county: newSecondaryForm.value.county,
          city: newSecondaryForm.value.city,
          street: newSecondaryForm.value.street,
          postalCode: newSecondaryForm.value.postalCode,
          recipientName,
          recipientPhone,
        }
      : null;
  }
  if (loggedAddressMode.value === 'gift') {
    return giftForm.value.county &&
      giftForm.value.city &&
      giftForm.value.street &&
      giftForm.value.postalCode &&
      giftForm.value.recipientFirstName &&
      giftForm.value.recipientLastName &&
      giftForm.value.recipientPhone
      ? {
          county: giftForm.value.county,
          city: giftForm.value.city,
          street: giftForm.value.street,
          postalCode: giftForm.value.postalCode,
          recipientFirstName: giftForm.value.recipientFirstName,
          recipientLastName: giftForm.value.recipientLastName,
          recipientName: `${giftForm.value.recipientFirstName} ${giftForm.value.recipientLastName}`.trim(),
          recipientPhone: giftForm.value.recipientPhone,
          label: 'Gift address',
        }
      : null;
  }
  return null;
});
const primaryAddressPreview = computed(() => {
  if (!primaryAddress.value) return t('noPrimaryAddress');
  return `${primaryAddress.value.street}, ${primaryAddress.value.city}, ${primaryAddress.value.county}, ${primaryAddress.value.postal_code}`;
});
const savedAddressCards = computed(() => {
  const cards = [];
  const titleBase = `${customerFullName.value || t('guestFirstName')} ${contactForm.value.phone ? `- ${contactForm.value.phone}` : ''}`.trim();
  if (primaryAddress.value) {
    cards.push({
      key: 'primary',
      title: titleBase,
      subtitle: primaryAddressPreview.value,
    });
  }
  secondaryAddresses.value.forEach((addr, idx) => {
    cards.push({
      key: `secondary-${idx}`,
      title: titleBase,
      subtitle: `${addr.street}, ${addr.city}, ${addr.county}, ${addr.postal_code}`,
      idx,
    });
  });
  return cards;
});
const visibleSavedAddressCards = computed(() => savedAddressCards.value.slice(0, 3));
const canSaveAsSecondaryAddress = computed(() =>
  editAddressTarget.value.type === 'secondary' || savedAddressCards.value.length < 3,
);
const selectedSavedAddressKey = computed(() => {
  if (loggedAddressMode.value === 'primary') return 'primary';
  if (loggedAddressMode.value === 'secondary' && selectedSecondaryIndex.value >= 0) {
    return `secondary-${selectedSecondaryIndex.value}`;
  }
  return '';
});
const selectedAddressSummary = computed(() => {
  if (!selectedDeliveryAddress.value) return t('selectValidAddress');
  return `${selectedDeliveryAddress.value.street}, ${selectedDeliveryAddress.value.city}, ${selectedDeliveryAddress.value.county}, ${selectedDeliveryAddress.value.postalCode}`;
});
function selectSavedAddress(addr) {
  isGiftDelivery.value = false;
  if (addr.key === 'primary') {
    loggedAddressMode.value = 'primary';
    selectedSecondaryIndex.value = -1;
    return;
  }
  if (typeof addr.idx === 'number') {
    loggedAddressMode.value = 'secondary';
    selectedSecondaryIndex.value = addr.idx;
  }
}
function openNewSecondaryAddress() {
  isGiftDelivery.value = false;
  loggedAddressMode.value = 'newSecondary';
  editAddressTarget.value = { type: '', index: -1 };
  saveAsSecondary.value = canSaveAsSecondaryAddress.value;
  newSecondaryForm.value = {
    label: t('defaultSecondaryLabel'),
    county: '',
    city: '',
    street: '',
    postalCode: '',
  };
  addressSaved.value = false;
  checkoutError.value = '';
}
function toggleGiftDelivery() {
  isGiftDelivery.value = !isGiftDelivery.value;
}
function formatApiError(err) {
  return formatPhoneApiError(err, t) || extractApiErrorMessage(err);
}
function syncBillingFormFromContact() {
  const synced = buildBillingFromDelivery();
  billingForm.value.firstName = synced.firstName;
  billingForm.value.lastName = synced.lastName;
  billingForm.value.phone = synced.phone;
  billingForm.value.street = synced.street;
  billingForm.value.city = synced.city;
  billingForm.value.county = synced.county;
  billingForm.value.postalCode = synced.postalCode;
}
function syncBillingAddressOnly() {
  if (!useDifferentBilling.value) return;
  const billingSource =
    isLoggedIn.value && isGiftDelivery.value
      ? getPrimaryAddressForBilling()
      : selectedDeliveryAddress.value;
  if (!billingSource) return;
  billingForm.value.street =
    billingSource.street || billingForm.value.street;
  billingForm.value.city =
    billingSource.city || billingForm.value.city;
  billingForm.value.county =
    billingSource.county || billingForm.value.county;
  billingForm.value.postalCode =
    billingSource.postalCode || billingForm.value.postalCode;
}
function getPrimaryAddressForBilling() {
  if (!primaryAddress.value) return null;
  return {
    street: primaryAddress.value.street || '',
    city: primaryAddress.value.city || '',
    county: primaryAddress.value.county || '',
    postalCode: primaryAddress.value.postal_code || '',
  };
}
function syncBillingAddressWithDelivery() {
  if (!useDifferentBilling.value) return;
  if (billingType.value !== 'individual') return;
  syncBillingAddressOnly();
}
async function lookupCompanyByCui() {
  const cleaned = String(billingForm.value.cui || '').replace(/\D/g, '');
  if (!cleaned) {
    billingLookupError.value = t('billingCuiRequired');
    return;
  }
  const base = getBaseUrl();
  billingLookupLoading.value = true;
  billingLookupError.value = '';
  try {
    const res = await fetch(`${base}/checkout/company/${cleaned}`);
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      billingLookupError.value = data?.message || t('billingLookupFailed');
      return;
    }
    billingForm.value.companyName = data.name || billingForm.value.companyName;
    billingForm.value.cui = data.cui || cleaned;
    billingForm.value.tradeRegister = data.tradeRegister || '';
    billingForm.value.street = data.address || billingForm.value.street;
  } catch (error) {
    console.error('Failed to lookup company by CUI:', error);
    billingLookupError.value = t('billingLookupFailed');
  } finally {
    billingLookupLoading.value = false;
  }
}
function editSavedAddress(addr) {
  isGiftDelivery.value = false;
  loggedAddressMode.value = 'newSecondary';
  addressSaved.value = false;
  if (addr.key === 'primary' && primaryAddress.value) {
    editAddressTarget.value = { type: 'primary', index: -1 };
    saveAsSecondary.value = false;
    newSecondaryForm.value = {
      label: t('addressModePrimary'),
      county: primaryAddress.value.county || '',
      city: primaryAddress.value.city || '',
      street: primaryAddress.value.street || '',
      postalCode: primaryAddress.value.postal_code || '',
    };
    return;
  }
  if (typeof addr.idx === 'number') {
    const selected = secondaryAddresses.value[addr.idx];
    if (!selected) return;
    editAddressTarget.value = { type: 'secondary', index: addr.idx };
    saveAsSecondary.value = true;
    newSecondaryForm.value = {
      label: selected.label || '',
      county: selected.county || '',
      city: selected.city || '',
      street: selected.street || '',
      postalCode: selected.postal_code || '',
    };
  }
}
function updateLocalUser(partial) {
  try {
    const raw = localStorage.getItem('user');
    if (!raw) return;
    const stored = JSON.parse(raw);
    const updated = { ...stored, ...partial };
    localStorage.setItem('user', JSON.stringify(updated));
  } catch (error) {
    console.error('Failed to update local user:', error);
  }
}
async function syncProfileFromCheckout() {
  const token = localStorage.getItem('token');
  const base = getBaseUrl();
  const normalizedPhone = normalizeRomanianPhone(contactForm.value.phone);
  if (contactForm.value.phone?.trim() && !normalizedPhone) {
    checkoutError.value = t('phoneInvalidFormat');
    return false;
  }
  try {
    const profilePayload = {};
    if (contactForm.value.firstName?.trim()) {
      profilePayload.first_name = contactForm.value.firstName.trim();
    }
    if (contactForm.value.lastName?.trim()) {
      profilePayload.last_name = contactForm.value.lastName.trim();
    }
    if (Object.keys(profilePayload).length > 0) {
      const res = await fetch(`${base}/users/profile`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(profilePayload),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => null);
        checkoutError.value = formatApiError(err) || t('profileSyncFailed');
        return false;
      }
      updateLocalUser(profilePayload);
    }
    if (normalizedPhone && normalizedPhone !== savedProfilePhone.value) {
      const res = await fetch(`${base}/users/profile/phone`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ phone: normalizedPhone }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => null);
        checkoutError.value = formatApiError(err) || t('profileSyncFailed');
        return false;
      }
      savedProfilePhone.value = normalizedPhone;
      contactForm.value.phone = normalizedPhone;
      updateLocalUser({ phone: normalizedPhone });
    }
    const addr = selectedDeliveryAddress.value;
    if (addr && !primaryAddress.value) {
      const primaryPayload = {
        county: addr.county,
        city: addr.city,
        street: addr.street,
        postal_code: addr.postalCode,
      };
      const res = await fetch(`${base}/users/profile/address`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(primaryPayload),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => null);
        checkoutError.value = formatApiError(err) || t('profileSyncFailed');
        return false;
      }
      primaryAddress.value = primaryPayload;
      updateLocalUser(primaryPayload);
    }
    if (!useDifferentBilling.value) {
      billingForm.value.firstName = contactForm.value.firstName;
      billingForm.value.lastName = contactForm.value.lastName;
      billingForm.value.phone = normalizedPhone || contactForm.value.phone;
    }
    customerFullName.value = `${contactForm.value.firstName} ${contactForm.value.lastName}`.trim();
    return true;
  } catch (error) {
    console.error('Failed to sync profile from checkout:', error);
    checkoutError.value = t('profileSyncFailed');
    return false;
  }
}
function markAddressDirty() {
  addressSaved.value = false;
}
async function saveAddressFromForm() {
  const token = localStorage.getItem('token');
  const base = getBaseUrl();
  addressSaving.value = true;
  checkoutError.value = '';
  try {
    const addressPayload = {
      label:
        newSecondaryForm.value.label?.trim() ||
        t('defaultSecondaryLabel'),
      county: newSecondaryForm.value.county,
      city: newSecondaryForm.value.city,
      street: newSecondaryForm.value.street,
      postal_code: newSecondaryForm.value.postalCode,
    };
    if (editAddressTarget.value.type === 'primary' || !primaryAddress.value) {
      const primaryPayload = {
        county: newSecondaryForm.value.county,
        city: newSecondaryForm.value.city,
        street: newSecondaryForm.value.street,
        postal_code: newSecondaryForm.value.postalCode,
      };
      const res = await fetch(`${base}/users/profile/address`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(primaryPayload),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => null);
        checkoutError.value = err?.message || t('addressSaveFailed');
        return false;
      }
      primaryAddress.value = {
        county: newSecondaryForm.value.county,
        city: newSecondaryForm.value.city,
        street: newSecondaryForm.value.street,
        postal_code: newSecondaryForm.value.postalCode,
      };
      loggedAddressMode.value = 'primary';
      addressSaved.value = true;
      return true;
    }
    if (editAddressTarget.value.type === 'secondary' && editAddressTarget.value.index >= 0) {
      const res = await fetch(
        `${base}/users/profile/secondary-address/${editAddressTarget.value.index}`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(addressPayload),
        },
      );
      if (!res.ok) {
        const err = await res.json().catch(() => null);
        checkoutError.value = err?.message || t('addressSaveFailed');
        return false;
      }
      const data = await res.json();
      secondaryAddresses.value = Array.isArray(data.secondaryAddresses)
        ? data.secondaryAddresses
        : secondaryAddresses.value;
      selectedSecondaryIndex.value = editAddressTarget.value.index;
      loggedAddressMode.value = 'secondary';
      addressSaved.value = true;
      return true;
    }
    if (saveAsSecondary.value && canSaveAsSecondaryAddress.value) {
      const res = await fetch(`${base}/users/profile/secondary-address`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(addressPayload),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => null);
        checkoutError.value = err?.message || t('addressSaveFailed');
        return false;
      }
      const data = await res.json();
      secondaryAddresses.value = Array.isArray(data.secondaryAddresses)
        ? data.secondaryAddresses
        : secondaryAddresses.value;
      selectedSecondaryIndex.value = secondaryAddresses.value.length - 1;
      loggedAddressMode.value = 'secondary';
      addressSaved.value = true;
      return true;
    }
    addressSaved.value = true;
    return true;
  } catch (error) {
    console.error('Failed to save secondary address:', error);
    return false;
  } finally {
    addressSaving.value = false;
  }
}
function requestDeleteSavedAddress(addr) {
  if (typeof addr?.idx !== 'number') return;
  const selected = secondaryAddresses.value[addr.idx];
  if (!selected) {
    checkoutError.value = t('addressDeleteFailed');
    return;
  }
  pendingDeleteAddress.value = {
    idx: addr.idx,
    label: selected.label || '',
    street: selected.street || '',
    city: selected.city || '',
    county: selected.county || '',
    postal_code: selected.postal_code || '',
  };
  showDeleteAddressModal.value = true;
}
function closeDeleteAddressModal() {
  showDeleteAddressModal.value = false;
  pendingDeleteAddress.value = null;
}
async function deleteSavedAddress() {
  const addr = pendingDeleteAddress.value;
  if (typeof addr?.idx !== 'number') return;
  const token = localStorage.getItem('token');
  const base = getBaseUrl();
  checkoutError.value = '';
  try {
    const res = await fetch(`${base}/users/profile/secondary-address/${addr.idx}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      checkoutError.value = data?.message || t('addressDeleteFailed');
      return;
    }
    secondaryAddresses.value = Array.isArray(data.secondaryAddresses)
      ? data.secondaryAddresses
      : [];

    if (loggedAddressMode.value === 'secondary') {
      if (secondaryAddresses.value.length === 0) {
        selectedSecondaryIndex.value = -1;
        loggedAddressMode.value = primaryAddress.value ? 'primary' : 'gift';
      } else {
        selectedSecondaryIndex.value = Math.min(
          selectedSecondaryIndex.value,
          secondaryAddresses.value.length - 1,
        );
      }
    }
    closeDeleteAddressModal();
  } catch (error) {
    console.error('Failed to delete secondary address:', error);
    checkoutError.value = t('addressDeleteFailed');
  } finally {
    closeDeleteAddressModal();
  }
}
watch(isGiftDelivery, (checked) => {
  checkoutError.value = '';
  if (checked) {
    loggedAddressMode.value = 'gift';
    selectedSecondaryIndex.value = -1;
    return;
  }
  loggedAddressMode.value = primaryAddress.value ? 'primary' : 'secondary';
  if (!primaryAddress.value && secondaryAddresses.value.length > 0) {
    selectedSecondaryIndex.value = 0;
  }
});
watch(
  contactForm,
  (contact) => {
    customerFullName.value = `${contact.firstName} ${contact.lastName}`.trim();
    if (!useDifferentBilling.value) {
      syncBillingFormFromContact();
    }
  },
  { deep: true },
);
watch(useDifferentBilling, (enabled) => {
  if (!enabled) {
    billingType.value = 'individual';
    syncBillingFormFromContact();
    return;
  }
  if (billingType.value === 'individual') {
    syncBillingAddressOnly();
  }
});
watch(
  selectedDeliveryAddress,
  () => {
    if (!useDifferentBilling.value) {
      syncBillingFormFromContact();
      return;
    }
    syncBillingAddressWithDelivery();
  },
  { immediate: true },
);
watch(billingType, (type) => {
  if (type === 'individual') {
    syncBillingAddressWithDelivery();
    return;
  }
  billingLookupError.value = '';
  billingForm.value.companyName = '';
  billingForm.value.cui = '';
  billingForm.value.tradeRegister = '';
  billingForm.value.street = '';
  billingForm.value.city = '';
  billingForm.value.county = '';
  billingForm.value.postalCode = '';
});
const loggedAddressValid = computed(() =>
  isLoggedIn.value ? !!selectedDeliveryAddress.value : true,
);
const canAccessStep3 = computed(() =>
  isLoggedIn.value ? loggedAddressValid.value && loggedContactValid.value : !hasGuestFormErrors.value,
);
function isStepLocked(step) { return step === 3 && !canAccessStep3.value; }
function navigateToStep(step) {
  if (step === currentStep.value) return;
  if (step === 3 && !canAccessStep3.value) {
    guestSubmitAttempted.value = true;
    loggedSubmitAttempted.value = true;
    Object.keys(guestTouched.value).forEach((field) => { guestTouched.value[field] = true; });
    Object.keys(loggedContactTouched.value).forEach((field) => { loggedContactTouched.value[field] = true; });
    checkoutError.value = isLoggedIn.value ? t('loggedMissingContactOrAddress') : t('guestMissingFields');
    currentStep.value = 2;
    return;
  }
  checkoutError.value = '';
  currentStep.value = step;
}
function goToDeliveryStep() { if (!cartProducts.value.length) return; checkoutError.value = ''; currentStep.value = 2; }
async function goToPaymentStep() {
  checkoutError.value = '';
  if (!isLoggedIn.value) {
    guestSubmitAttempted.value = true;
    Object.keys(guestTouched.value).forEach((field) => { guestTouched.value[field] = true; });
    if (hasGuestFormErrors.value) { checkoutError.value = t('guestMissingFields'); return; }
  } else {
    loggedSubmitAttempted.value = true;
    Object.keys(loggedContactTouched.value).forEach((field) => { loggedContactTouched.value[field] = true; });
    if (!loggedContactValid.value) {
      checkoutError.value = t('loggedMissingContact');
      return;
    }
    if (!loggedAddressValid.value) {
      checkoutError.value = t('selectValidAddress');
      return;
    }
    if (loggedAddressMode.value === 'newSecondary') {
      const saved = await saveAddressFromForm();
      if (!saved) {
        checkoutError.value = checkoutError.value || t('addressSaveFailed');
        return;
      }
    }
    const synced = await syncProfileFromCheckout();
    if (!synced) return;
  }
  currentStep.value = 3;
}
async function goToCheckout() {
  const token = typeof localStorage !== 'undefined' ? localStorage.getItem('token') : null;
  checkoutError.value = '';
  guestSubmitAttempted.value = true;
  termsTouched.value = true;
  if (!canPlaceOrder.value) { checkoutError.value = !termsAccepted.value ? t('guestTermsRequired') : t('guestMissingFields'); return; }
  if (token) {
    loggedSubmitAttempted.value = true;
    Object.keys(loggedContactTouched.value).forEach((field) => { loggedContactTouched.value[field] = true; });
    if (!loggedContactValid.value || !loggedAddressValid.value) {
      checkoutError.value = t('loggedMissingContactOrAddress');
      currentStep.value = 2;
      return;
    }
    const synced = await syncProfileFromCheckout();
    if (!synced) {
      currentStep.value = 2;
      return;
    }
  }
  checkoutLoading.value = true;
  const base = getBaseUrl();
  const successPath = localePath('/plata/succes');
  const cancelPath = localePath('/plata/anulata');
  try {
    const isCash = !payOnline.value;
    const endpoint = isCash ? 'cash-order' : 'create-session';
    const payload = isCash
      ? token
        ? { deliveryAddress: selectedDeliveryAddress.value, billingDetails: billingDetailsPayload.value }
        : {
            items: cartItems.value,
            guestCartId: getOrCreateGuestCartId(),
            guest: guestForm.value,
            billingDetails: billingDetailsPayload.value,
          }
      : token
        ? { successUrl: successPath, cancelUrl: cancelPath, deliveryAddress: selectedDeliveryAddress.value, billingDetails: billingDetailsPayload.value }
        : {
            successUrl: successPath,
            cancelUrl: cancelPath,
            items: cartItems.value,
            guestCartId: getOrCreateGuestCartId(),
            guest: guestForm.value,
            billingDetails: billingDetailsPayload.value,
          };
    const res = await fetch(`${base}/checkout/${endpoint}`, { method: 'POST', headers: token ? { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` } : { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      checkoutError.value = data.message || t('checkoutError');
      return;
    }
    if (data.url) { window.location.href = data.url; return; }
    if (data.success) {
      await clearCart();
      await syncStoredUserProfile();
      await router.push(successPath);
      return;
    }
    checkoutError.value = t('checkoutError');
  } catch (error) {
    console.error('Checkout error:', error);
    checkoutError.value = t('checkoutError');
  } finally {
    checkoutLoading.value = false;
  }
}
onMounted(async () => {
  isLoggedIn.value = typeof localStorage !== 'undefined' && !!localStorage.getItem('token');
  if (isLoggedIn.value && typeof localStorage !== 'undefined') {
    try {
      const raw = localStorage.getItem('user');
      if (raw) {
        const user = JSON.parse(raw);
        customerFullName.value = `${user.first_name || ''} ${user.last_name || ''}`.trim();
        savedProfilePhone.value = user.phone || '';
        contactForm.value.firstName = user.first_name || '';
        contactForm.value.lastName = user.last_name || '';
        contactForm.value.phone = user.phone || '';
        billingForm.value.firstName = user.first_name || '';
        billingForm.value.lastName = user.last_name || '';
        billingForm.value.email = user.email || '';
        billingForm.value.phone = user.phone || '';
      }
    } catch (error) {
      console.error('Failed to parse local user:', error);
    }
  }
  const base = getBaseUrl();
    const productHeaders = {
      ...buildGuestCartHeaders(),
      ...(localStorage.getItem('token')
        ? { Authorization: `Bearer ${localStorage.getItem('token')}` }
        : {}),
    };
  try { const res = await fetch(`${base}/products`, { headers: productHeaders }); if (res.ok) allProducts.value = await res.json(); } catch (error) { console.error('Failed to fetch products for cart:', error); }
  await refreshGuestReservations();
  clampCartQuantitiesToStock();
  if (isLoggedIn.value) {
    const token = localStorage.getItem('token');
    try {
      const res = await fetch(`${base}/users/profile/checkout-addresses`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        primaryAddress.value = data.primaryAddress;
        secondaryAddresses.value = Array.isArray(data.secondaryAddresses)
          ? data.secondaryAddresses
          : [];
        savedProfilePhone.value = data.phone || savedProfilePhone.value;
        contactForm.value.firstName = data.firstName || contactForm.value.firstName;
        contactForm.value.lastName = data.lastName || contactForm.value.lastName;
        contactForm.value.phone = data.phone || contactForm.value.phone;
        billingForm.value.phone = data.phone || billingForm.value.phone;
        if (data.primaryAddress) {
          billingForm.value.street = data.primaryAddress.street || billingForm.value.street;
          billingForm.value.city = data.primaryAddress.city || billingForm.value.city;
          billingForm.value.county = data.primaryAddress.county || billingForm.value.county;
          billingForm.value.postalCode =
            data.primaryAddress.postal_code || billingForm.value.postalCode;
        }
        if (!data.primaryAddress && secondaryAddresses.value.length > 0) {
          loggedAddressMode.value = 'secondary';
          selectedSecondaryIndex.value = 0;
        } else if (!data.primaryAddress && secondaryAddresses.value.length === 0) {
          loggedAddressMode.value = 'newSecondary';
          newSecondaryForm.value.label = t('defaultSecondaryLabel');
        }
      }
    } catch (error) {
      console.error('Failed to load checkout addresses:', error);
    }
  }
  if (route.query.step === '3' && cartProducts.value.length > 0) {
    currentStep.value = canAccessStep3.value ? 3 : 2;
  }
});

watch(cartProducts, (items) => {
  if (!items.length) {
    currentStep.value = 1;
  }
});
</script>

<style scoped>
.quantity-input::-webkit-outer-spin-button,
.quantity-input::-webkit-inner-spin-button { -webkit-appearance: none; margin: 0; }
.quantity-input { -moz-appearance: textfield; appearance: textfield; }
.quantity-input:focus { outline: none; border: none; box-shadow: none; }
.step-badge { width: 28px; height: 28px; border-radius: 9999px; border: 1px solid #d1d5db; color: #6b7280; display: inline-flex; align-items: center; justify-content: center; font-size: 13px; }
.step-badge--active { background: #6f825d; border-color: #6f825d; color: #fff; }
.step-line { width: 52px; height: 1px; background: #d1d5db; }
</style>

<i18n lang="json">
{
  "en": {
    "steps": { "cart": "Cart", "delivery": "Delivery", "payment": "Payment" },
    "title": "Your Cart",
    "deliveryTitle": "Delivery Information",
    "paymentTitle": "Checkout",
    "empty": "Your cart is empty.",
    "emptySubtitle": "Discover handcrafted pieces you might love.",
    "recommendedTitle": "You might also like",
    "recommendedSubtitle": "Other pieces crafted with the same passion.",
    "viewAllCollection": "View full collection",
    "continueShopping": "Continue shopping",
    "summaryTitle": "Order Summary",
    "subtotal": "Subtotal",
    "delivery": "Delivery",
    "total": "Total",
    "cashOperationalFee": "Cash handling fee",
    "qty": "Qty",
    "goToDelivery": "Continue to delivery",
    "goToPayment": "Continue to payment",
    "checkout": "Pay and finalize",
    "checkoutCash": "Finalize order",
    "back": "Back",
    "checkoutError": "Could not create payment session. Try again.",
    "guestFirstName": "First name",
    "guestLastName": "Last name",
    "guestEmail": "Email",
    "guestPhone": "Phone",
    "guestCounty": "County",
    "guestCity": "City",
    "guestStreet": "Street and number",
    "guestPostalCode": "Postal code",
    "addressModePrimary": "Home",
    "addressModeSecondary": "Choose a saved secondary address",
    "addressModeNewSecondary": "Add a new secondary address",
    "addressModeGift": "Gift address",
    "addressTypeLabel": "Delivery address type",
    "addressTypeHint": "Choose the type of delivery address for this order.",
    "chooseDeliveryAddress": "Choose delivery address",
    "addNewAddressShort": "Add new address",
    "giftCheckboxLabel": "This order is a gift",
    "editLabel": "edit",
    "deleteLabel": "delete",
    "confirmDeleteAddressTitle": "Delete secondary address",
    "confirmDeleteAddressDescription": "Are you sure you want to delete this secondary address?",
    "cancelDeleteAddress": "Cancel",
    "confirmDeleteAddress": "Delete address",
    "billingDataTitle": "Billing details",
    "billingIndividual": "Individual",
    "billingCompany": "Company",
    "billingCui": "Company CUI",
    "billingCuiRequired": "Please enter CUI first.",
    "billingLookupFailed": "Company data could not be loaded from CUI.",
    "loadingCompanyData": "Loading...",
    "loadCompanyData": "Auto-fill from CUI",
    "billingCompanyName": "Company name",
    "billingTradeRegister": "Trade register number",
    "selectSecondaryAddress": "Select secondary address",
    "secondaryLabel": "Address label (ex: Home, Office)",
    "defaultSecondaryLabel": "Home",
    "saveAsSecondary": "Save this as secondary address",
    "saveAddressBtn": "Save address",
    "savingAddress": "Saving...",
    "addressSavedMsg": "Address saved",
    "addressSaveFailed": "Address could not be saved. Please try again.",
    "addressDeleteFailed": "Address could not be deleted. Please try again.",
    "savedAddressLimitReached": "You can use maximum 3 saved addresses in checkout. Use gift delivery as the 4th option.",
    "addressUsedOnlyForOrder": "This address will be used only for the current order.",
    "secondaryAddressLimitReached": "You can save up to 10 secondary addresses.",
    "giftRecipientName": "Gift recipient full name",
    "giftRecipientFirstName": "Gift recipient first name",
    "giftRecipientLastName": "Gift recipient last name",
    "noPrimaryAddress": "No primary address saved in profile.",
    "selectValidAddress": "Select or complete a valid delivery address.",
    "guestFirstNameExample": "ex. Maria",
    "guestLastNameExample": "ex. Popescu",
    "guestEmailExample": "maria(at)example.com",
    "guestPhoneExample": "07xxxxxxxx",
    "guestStreetExample": "Street and number",
    "guestCountyExample": "County",
    "guestCityExample": "ex. Bucharest",
    "guestPostalCodeExample": "123456",
    "guestMissingFields": "Please complete all required details for guest checkout.",
    "guestTermsPrefix": "I agree with the",
    "guestTermsLink": "Terms and Conditions",
    "guestTermsRequired": "You must accept the Terms and Conditions to continue.",
    "guestValidationRequired": "This field is required.",
    "guestValidationInvalidEmail": "Please enter a valid email address.",
    "guestValidationInvalidPhone": "Please enter a valid phone number (ex: 07XXXXXXXX).",
    "guestValidationInvalidPostalCode": "Postal code must contain exactly 6 digits.",
    "guestValidationInvalidName": "Please enter a valid name (minimum 2 letters).",
    "guestValidationInvalidLocation": "Please enter a valid county/city (minimum 2 letters).",
    "guestValidationInvalidStreet": "Street address must contain at least 5 characters.",
    "promoPlaceholder": "Promo code",
    "promoApply": "Apply",
    "payOnline": "Online card payment",
    "payOnlineHint": "Securely processed by payment gateway.",
    "payOnDelivery": "Cash on delivery",
    "payOnDeliveryHint": "Pay when your package arrives.",
    "securePayment": "Secure payment. Return options within 14 days.",
    "decreaseQty": "Decrease quantity",
    "increaseQty": "Increase quantity",
    "remove": "Remove",
    "contactDetailsTitle": "Contact details",
    "contactDetailsHint": "Pre-filled from your account. Required to place an order.",
    "requiredFieldsNote": "Fields marked with * are required.",
    "loggedMissingContact": "Please complete your name and phone number to continue.",
    "loggedMissingContactOrAddress": "Please complete your contact details and delivery address to continue.",
    "profileSyncFailed": "Could not save your details to profile. Please try again.",
    "phoneInvalidFormat": "Phone number must be exactly 10 digits (ex: 07XXXXXXXX).",
    "phoneAlreadyInUse": "This phone number is already used by another account.",
    "useDifferentBilling": "Use different billing details than delivery",
    "billingSameAsDelivery": "Billing details will match your contact and delivery information."
  },
  "ro": {
    "steps": { "cart": "Cos", "delivery": "Livrare", "payment": "Plata" },
    "title": "Cosul tau de cumparaturi",
    "deliveryTitle": "Informatii de livrare",
    "paymentTitle": "Finalizare comanda",
    "empty": "Cosul tau este gol.",
    "emptySubtitle": "Descopera piese lucrate manual care ti-ar putea placea.",
    "recommendedTitle": "S-ar putea sa-ti placa",
    "recommendedSubtitle": "Alte piese lucrate cu aceeasi pasiune.",
    "viewAllCollection": "Vezi toata colectia",
    "continueShopping": "Continua cumparaturile",
    "summaryTitle": "Sumar comanda",
    "subtotal": "Subtotal",
    "delivery": "Livrare",
    "total": "Total",
    "cashOperationalFee": "Taxa operationala cash",
    "qty": "Cantitate",
    "goToDelivery": "Continua spre livrare",
    "goToPayment": "Continua spre plata",
    "checkout": "Plateste si finalizeaza",
    "checkoutCash": "Finalizeaza comanda",
    "back": "Inapoi",
    "checkoutError": "Nu s-a putut crea sesiunea de plata. Incearca din nou.",
    "guestFirstName": "Prenume",
    "guestLastName": "Nume",
    "guestEmail": "Adresa de email",
    "guestPhone": "Telefon",
    "guestCounty": "Judet",
    "guestCity": "Oras",
    "guestStreet": "Adresa livrare",
    "guestPostalCode": "Cod postal",
    "addressModePrimary": "Acasa",
    "addressModeSecondary": "Alege o adresa secundara salvata",
    "addressModeNewSecondary": "Adauga adresa secundara noua",
    "addressModeGift": "Adresa cadou",
    "addressTypeLabel": "Tip adresa de livrare",
    "addressTypeHint": "Alege tipul adresei de livrare pentru aceasta comanda.",
    "chooseDeliveryAddress": "Alege adresa de livrare",
    "addNewAddressShort": "Adauga adresa noua",
    "giftCheckboxLabel": "Aceasta comanda este cadou",
    "editLabel": "editeaza",
    "deleteLabel": "sterge",
    "confirmDeleteAddressTitle": "Sterge adresa secundara",
    "confirmDeleteAddressDescription": "Esti sigur ca vrei sa stergi aceasta adresa secundara?",
    "cancelDeleteAddress": "Anuleaza",
    "confirmDeleteAddress": "Sterge adresa",
    "billingDataTitle": "Date facturare",
    "billingIndividual": "Persoana fizica",
    "billingCompany": "Persoana juridica",
    "billingCui": "CUI firma",
    "billingCuiRequired": "Introdu mai intai CUI-ul.",
    "billingLookupFailed": "Nu am putut prelua datele firmei dupa CUI.",
    "loadingCompanyData": "Se incarca...",
    "loadCompanyData": "Completeaza automat din CUI",
    "billingCompanyName": "Nume firma",
    "billingTradeRegister": "Nr. Registrul Comertului",
    "selectSecondaryAddress": "Selecteaza adresa secundara",
    "secondaryLabel": "Eticheta adresa (ex: Acasa, Birou)",
    "defaultSecondaryLabel": "Acasa",
    "saveAsSecondary": "Salveaza aceasta adresa ca secundara",
    "saveAddressBtn": "Salveaza adresa",
    "savingAddress": "Se salveaza...",
    "addressSavedMsg": "Adresa a fost salvata",
    "addressSaveFailed": "Adresa nu a putut fi salvata. Incearca din nou.",
    "addressDeleteFailed": "Adresa nu a putut fi stearsa. Incearca din nou.",
    "savedAddressLimitReached": "Poti folosi maxim 3 adrese salvate in checkout. Foloseste livrarea cadou ca optiunea a 4-a.",
    "addressUsedOnlyForOrder": "Aceasta adresa va fi folosita doar pentru comanda curenta.",
    "secondaryAddressLimitReached": "Poti salva maxim 10 adrese secundare.",
    "giftRecipientName": "Nume complet destinatar cadou",
    "giftRecipientFirstName": "Prenume destinatar cadou",
    "giftRecipientLastName": "Nume destinatar cadou",
    "noPrimaryAddress": "Nu exista adresa principala salvata in cont.",
    "selectValidAddress": "Selecteaza sau completeaza o adresa de livrare valida.",
    "guestFirstNameExample": "ex. Maria",
    "guestLastNameExample": "ex. Popescu",
    "guestEmailExample": "maria(at)exemplu.ro",
    "guestPhoneExample": "07xxxxxxxx",
    "guestStreetExample": "Strada si numar",
    "guestCountyExample": "Judet",
    "guestCityExample": "ex. Bucuresti",
    "guestPostalCodeExample": "123456",
    "guestMissingFields": "Completeaza toate datele necesare pentru comanda fara cont.",
    "guestTermsPrefix": "Sunt de acord cu",
    "guestTermsLink": "Termenii si Conditiile",
    "guestTermsRequired": "Trebuie sa accepti Termenii si Conditiile pentru a continua.",
    "guestValidationRequired": "Acest camp este obligatoriu.",
    "guestValidationInvalidEmail": "Introdu o adresa de email valida.",
    "guestValidationInvalidPhone": "Introdu un numar de telefon valid (ex: 07XXXXXXXX).",
    "guestValidationInvalidPostalCode": "Codul postal trebuie sa contina exact 6 cifre.",
    "guestValidationInvalidName": "Introdu un nume valid (minim 2 litere).",
    "guestValidationInvalidLocation": "Introdu un judet/oras valid (minim 2 litere).",
    "guestValidationInvalidStreet": "Adresa strazii trebuie sa contina cel putin 5 caractere.",
    "promoPlaceholder": "Cod promo",
    "promoApply": "Aplica",
    "payOnline": "Card online",
    "payOnlineHint": "Plata securizata prin procesator.",
    "payOnDelivery": "Plata la livrare",
    "payOnDeliveryHint": "Platesti cand coletul ajunge la tine.",
    "securePayment": "Plata securizata. Optiuni de retur in 14 zile.",
    "decreaseQty": "Scade cantitatea",
    "increaseQty": "Creste cantitatea",
    "remove": "Elimina",
    "contactDetailsTitle": "Date de contact",
    "contactDetailsHint": "Preluate din contul tau. Sunt necesare pentru a plasa comanda.",
    "requiredFieldsNote": "Campurile marcate cu * sunt obligatorii.",
    "loggedMissingContact": "Completeaza numele si numarul de telefon pentru a continua.",
    "loggedMissingContactOrAddress": "Completeaza datele de contact si adresa de livrare pentru a continua.",
    "profileSyncFailed": "Nu am putut salva datele in profil. Incearca din nou.",
    "phoneInvalidFormat": "Numarul de telefon trebuie sa aiba exact 10 cifre (ex: 07XXXXXXXX).",
    "phoneAlreadyInUse": "Acest numar de telefon este deja folosit de alt cont.",
    "useDifferentBilling": "Doresc alte date de facturare decat cele de livrare",
    "billingSameAsDelivery": "Datele de facturare vor fi aceleasi cu datele de contact si livrare."
  }
}
</i18n>