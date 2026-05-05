<template>
  <div class="maini-ui__section md:px-4">
    <ClientOnly>
      <div class="maini-ui__container-products">
        <div class="mb-8 flex items-center justify-center gap-3">
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

        <div class="flex flex-col lg:flex-row gap-8 lg:gap-12">
          <div class="flex-1">
            <h1 class="text-2xl md:text-3xl font-bold h-color-lunar-green mb-6">{{ t(stepTitle) }}</h1>

            <div v-if="cartProducts.length === 0" class="py-12 text-center">
              <i class="ph ph-shopping-cart text-6xl mb-4 opacity-50 h-color-lunar-green"></i>
              <p class="text-lg h-color-lunar-green">{{ t('empty') }}</p>
              <NuxtLink :to="$localePath('/produse')" class="inline-flex items-center justify-center gap-2 mt-4 px-6 py-3 rounded-lg text-base font-semibold border border-[#6f825d] text-[#6f825d] hover:bg-[#f4f7f2] transition-colors">
                <i class="ph ph-arrow-left"></i>
                {{ t('continueShopping') }}
              </NuxtLink>
            </div>

            <template v-else>
              <section v-if="currentStep === 1" class="space-y-4">
                <article v-for="item in cartProducts" :key="item.product.id" class="flex flex-col sm:flex-row gap-4 p-4 bg-white rounded-lg shadow-sm border border-gray-100">
                  <NuxtLink :to="$localePath(`/produs/${item.product.id}`)" class="w-full sm:w-24 h-24 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
                    <img :src="item.product.image" :alt="item.product.title" class="w-full h-full object-cover" />
                  </NuxtLink>
                  <div class="flex-1 min-w-0">
                    <NuxtLink :to="$localePath(`/produs/${item.product.id}`)" class="font-semibold text-gray-800 hover:h-color-primary block">
                      {{ item.product.title }}
                    </NuxtLink>
                    <p class="text-sm text-gray-500 mt-0.5 line-clamp-2">{{ item.product.description }}</p>
                    <div class="mt-3 flex items-center gap-3">
                      <div class="flex items-center border border-gray-300 rounded-lg overflow-hidden">
                        <button type="button" class="w-8 h-8 flex items-center justify-center" :aria-label="t('decreaseQty')" @click="setQuantity(item.product.id, Math.max(1, item.quantity - 1))">
                          <i class="ph ph-minus text-xs"></i>
                        </button>
                        <input :value="item.quantity" type="number" min="1" class="quantity-input w-10 h-8 text-center border-none" @input="onQuantityInput(item.product.id, $event)" />
                        <button type="button" class="w-8 h-8 flex items-center justify-center" :aria-label="t('increaseQty')" @click="setQuantity(item.product.id, item.quantity + 1)">
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
                  <input v-model="termsAccepted" type="checkbox" class="mt-1" @blur="termsTouched = true" />
                  <span>{{ t('guestTermsLabel') }} *</span>
                </label>
                <p v-if="showTermsError" class="text-xs text-red-600">{{ t('guestTermsRequired') }}</p>
              </section>
            </template>
          </div>

          <aside v-if="cartProducts.length > 0" class="lg:w-92 flex-shrink-0 min-w-0">
            <div class="bg-white rounded-lg shadow-sm border border-gray-100 p-6 sticky top-4">
              <h2 class="text-3xl font-semibold h-color-lunar-green mb-4">{{ t('summaryTitle') }}</h2>
              <div class="space-y-3 mb-4 border-b border-gray-100 pb-4">
                <div v-for="item in cartProducts" :key="`summary-${item.product.id}`" class="flex items-center gap-3">
                  <img :src="item.product.image" :alt="item.product.title" class="w-14 h-14 rounded-md object-cover bg-gray-100" />
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
              <button v-else type="button" class="maini-ui-button__buy w-full rounded-lg text-base font-bold flex items-center justify-center gap-2" style="height: 52px; min-height: 52px;" :disabled="checkoutLoading || !canPlaceOrder" @click="goToCheckout">
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

      <template #fallback>
        <div class="maini-ui__container-products py-12 flex justify-center">
          <i class="ph ph-spinner text-4xl animate-spin h-color-primary"></i>
        </div>
      </template>
    </ClientOnly>
  </div>
</template>

<script setup>
defineI18nRoute({ paths: { ro: '/cos', en: '/cart' } });
const { t } = useI18n({ useScope: 'local' });
const { cartItems, setQuantity, removeFromCart } = useCart();
const localePath = useLocalePath();
const router = useRouter();
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
const subtotal = computed(() => cartProducts.value.reduce((sum, { product, quantity }) => sum + Number(product.price) * quantity, 0));
const deliveryFee = computed(() => 15);
const cashOperationalFee = computed(() => (payOnline.value ? 0 : 5));
const total = computed(() => subtotal.value + deliveryFee.value + cashOperationalFee.value);
const checkoutButtonLabel = computed(() => (payOnline.value ? t('checkout') : t('checkoutCash')));
const stepTitle = computed(() => (currentStep.value === 1 ? 'title' : currentStep.value === 2 ? 'deliveryTitle' : 'paymentTitle'));
function itemLineTotal({ product, quantity }) { return (Number(product.price) * quantity).toFixed(0); }
function onQuantityInput(productId, e) { const qty = parseInt(e?.target?.value, 10); setQuantity(productId, Number.isFinite(qty) && qty >= 1 ? qty : 1); }
function touchGuestField(field) { if (guestTouched.value[field] !== undefined) guestTouched.value[field] = true; }
function validateGuestField(field, value) {
  const trimmed = String(value || '').trim();
  if (!trimmed) return 'required';
  if (field === 'email') return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed) ? '' : 'invalidEmail';
  if (field === 'phone') return /^(\+4)?0[0-9]{9}$/.test(trimmed) ? '' : 'invalidPhone';
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
const hasGuestFormErrors = computed(() => Object.keys(guestForm.value).some((field) => !!validateGuestField(field, guestForm.value[field])));
const showTermsError = computed(() => (termsTouched.value || guestSubmitAttempted.value) && !termsAccepted.value);
const canPlaceOrder = computed(() => (isLoggedIn.value ? termsAccepted.value : termsAccepted.value && !hasGuestFormErrors.value));
const canAccessStep3 = computed(() => isLoggedIn.value || !hasGuestFormErrors.value);
function isStepLocked(step) { return step === 3 && !canAccessStep3.value; }
function navigateToStep(step) {
  if (step === currentStep.value) return;
  if (step === 3 && !canAccessStep3.value) {
    guestSubmitAttempted.value = true;
    Object.keys(guestTouched.value).forEach((field) => { guestTouched.value[field] = true; });
    checkoutError.value = t('guestMissingFields');
    currentStep.value = 2;
    return;
  }
  checkoutError.value = '';
  currentStep.value = step;
}
function goToDeliveryStep() { if (!cartProducts.value.length) return; checkoutError.value = ''; currentStep.value = 2; }
function goToPaymentStep() {
  checkoutError.value = '';
  if (!isLoggedIn.value) {
    guestSubmitAttempted.value = true;
    Object.keys(guestTouched.value).forEach((field) => { guestTouched.value[field] = true; });
    if (hasGuestFormErrors.value) { checkoutError.value = t('guestMissingFields'); return; }
  }
  currentStep.value = 3;
}
async function goToCheckout() {
  const token = typeof localStorage !== 'undefined' ? localStorage.getItem('token') : null;
  checkoutError.value = '';
  guestSubmitAttempted.value = true;
  termsTouched.value = true;
  if (!canPlaceOrder.value) { checkoutError.value = !termsAccepted.value ? t('guestTermsRequired') : t('guestMissingFields'); return; }
  checkoutLoading.value = true;
  const base = import.meta.env.VITE_BACKEND_URL || '';
  const successPath = localePath('/plata/succes');
  const cancelPath = localePath('/plata/anulata');
  try {
    const payload = token ? { successUrl: successPath, cancelUrl: cancelPath } : { successUrl: successPath, cancelUrl: cancelPath, items: cartItems.value, guest: guestForm.value };
    const res = await fetch(`${base}/checkout/create-session`, { method: 'POST', headers: token ? { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` } : { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      const serverMessage = data.message || t('checkoutError');
      if (typeof serverMessage === 'string' && (serverMessage.toLowerCase().includes('adresa') || serverMessage.toLowerCase().includes('address'))) { await router.push(`${localePath('/profil')}?completeContact=1`); return; }
      checkoutError.value = serverMessage;
      return;
    }
    if (data.url) { window.location.href = data.url; return; }
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
  const base = import.meta.env.VITE_BACKEND_URL || '';
  try { const res = await fetch(`${base}/products`); if (res.ok) allProducts.value = await res.json(); } catch (error) { console.error('Failed to fetch products for cart:', error); }
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
    "guestFirstNameExample": "ex. Maria",
    "guestLastNameExample": "ex. Popescu",
    "guestEmailExample": "maria(at)example.com",
    "guestPhoneExample": "07xxxxxxxx",
    "guestStreetExample": "Street and number",
    "guestCountyExample": "County",
    "guestCityExample": "ex. Bucharest",
    "guestPostalCodeExample": "123456",
    "guestMissingFields": "Please complete all required details for guest checkout.",
    "guestTermsLabel": "I agree with the Terms and Conditions.",
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
    "remove": "Remove"
  },
  "ro": {
    "steps": { "cart": "Cos", "delivery": "Livrare", "payment": "Plata" },
    "title": "Cosul tau de cumparaturi",
    "deliveryTitle": "Informatii de livrare",
    "paymentTitle": "Finalizare comanda",
    "empty": "Cosul tau este gol.",
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
    "guestFirstNameExample": "ex. Maria",
    "guestLastNameExample": "ex. Popescu",
    "guestEmailExample": "maria(at)exemplu.ro",
    "guestPhoneExample": "07xxxxxxxx",
    "guestStreetExample": "Strada si numar",
    "guestCountyExample": "Judet",
    "guestCityExample": "ex. Bucuresti",
    "guestPostalCodeExample": "123456",
    "guestMissingFields": "Completeaza toate datele necesare pentru comanda fara cont.",
    "guestTermsLabel": "Sunt de acord cu Termenii si Conditiile.",
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
    "remove": "Elimina"
  }
}
</i18n>