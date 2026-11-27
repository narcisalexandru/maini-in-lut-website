import { PaymentMethod } from '../common/enums/order-status.enum';

const CURRENCY = 'RON';
const COUNTRY = 'Romania';
const DELIVERY_LINE_NAME = 'Transport';
const CASH_FEE_LINE_NAME = 'Taxă operațională ramburs';
const CARD_PAYMENT_TYPE = 'Card';
const CASH_PAYMENT_TYPE = 'Alta incasare';

export type SmartbillInvoiceConfig = {
  companyVatCode: string;
  seriesName: string;
  vatPayer: boolean;
  draft: boolean;
  taxName: string;
  taxPercentage: number;
  measuringUnitName: string;
  sendEmail: boolean;
};

export type SmartbillInvoiceSource = {
  publicOrderNumber: string;
  paymentMethod: PaymentMethod;
  customerFirstName: string;
  customerLastName: string;
  customerEmail: string;
  customerPhone: string;
  deliveryCounty: string;
  deliveryCity: string;
  deliveryStreet: string;
  deliveryPostalCode: string;
  billingDetails: Record<string, unknown> | null;
  deliveryFeeRon: number | string;
  cashOperationalFeeRon: number | string;
  items: Array<{
    productId: number;
    title: string;
    quantity: number;
    unitPriceRon: number | string;
  }>;
};

export type SmartbillProductLine = {
  name: string;
  code?: string;
  isDiscount: false;
  measuringUnitName: string;
  currency: typeof CURRENCY;
  quantity: number;
  price: number;
  isTaxIncluded?: true;
  taxName?: string;
  taxPercentage?: number;
  saveToDb: false;
  isService: boolean;
};

export type SmartbillInvoicePayload = {
  companyVatCode: string;
  client: {
    name: string;
    vatCode?: string;
    isTaxPayer: boolean;
    address: string;
    city: string;
    county: string;
    country: typeof COUNTRY;
    email: string;
    phone?: string;
    saveToDb: false;
  };
  issueDate: string;
  seriesName: string;
  isDraft: boolean;
  dueDate: string;
  deliveryDate: string;
  products: SmartbillProductLine[];
  payment: {
    value: number;
    type: string;
    isCash: boolean;
  };
  sendEmail?: true;
};

function text(value: unknown): string {
  return typeof value === 'string' ? value.trim() : '';
}

function money(value: number | string): number {
  const parsed = typeof value === 'number' ? value : Number(value);
  if (!Number.isFinite(parsed)) {
    return 0;
  }
  return Math.round(parsed * 100) / 100;
}

function lineAmount(quantity: number, unitPrice: number): number {
  return money(quantity * unitPrice);
}

export function buildSmartbillInvoice(
  order: SmartbillInvoiceSource,
  config: SmartbillInvoiceConfig,
  issueDate: string,
): SmartbillInvoicePayload {
  const billing = order.billingDetails ?? {};
  const isCompany = billing.type === 'company';
  const cui = text(billing.cui).replace(/\s+/g, '');
  const customerName = `${order.customerFirstName} ${order.customerLastName}`.trim();
  const street = text(billing.street) || order.deliveryStreet;
  const city = text(billing.city) || order.deliveryCity;
  const county = text(billing.county) || order.deliveryCounty;
  const postalCode = text(billing.postalCode) || order.deliveryPostalCode;
  const address = [street, postalCode].map((part) => part.trim()).filter(Boolean).join(', ');
  const email = text(billing.email) || order.customerEmail;
  const phone = text(billing.phone) || order.customerPhone;

  const products: SmartbillProductLine[] = order.items
    .filter((item) => item.quantity > 0)
    .map((item) => ({
      name: item.title.slice(0, 200),
      code: `P${item.productId}`,
      isDiscount: false,
      measuringUnitName: config.measuringUnitName,
      currency: CURRENCY,
      quantity: item.quantity,
      price: money(item.unitPriceRon),
      ...taxFields(config),
      saveToDb: false,
      isService: false,
    }));

  const deliveryFee = money(order.deliveryFeeRon);
  if (deliveryFee > 0) {
    products.push(serviceLine(DELIVERY_LINE_NAME, deliveryFee, config));
  }

  const cashFee = money(order.cashOperationalFeeRon);
  if (cashFee > 0) {
    products.push(serviceLine(CASH_FEE_LINE_NAME, cashFee, config));
  }

  if (!products.length) {
    throw new Error('Order has no billable lines');
  }

  const paymentValue = money(
    products.reduce((sum, line) => sum + lineAmount(line.quantity, line.price), 0),
  );
  const isCash = order.paymentMethod === PaymentMethod.CASH;

  const payload: SmartbillInvoicePayload = {
    companyVatCode: config.companyVatCode,
    client: {
      name: (isCompany ? text(billing.companyName) || customerName : customerName).slice(0, 200),
      isTaxPayer: /^RO\d/i.test(cui),
      address: address.slice(0, 500),
      city: city.slice(0, 100),
      county: county.slice(0, 100),
      country: COUNTRY,
      email,
      saveToDb: false,
    },
    issueDate,
    seriesName: config.seriesName,
    isDraft: config.draft,
    dueDate: issueDate,
    deliveryDate: issueDate,
    products,
    payment: {
      value: paymentValue,
      type: isCash ? CASH_PAYMENT_TYPE : CARD_PAYMENT_TYPE,
      isCash,
    },
  };

  if (cui) {
    payload.client.vatCode = cui;
  }
  if (phone) {
    payload.client.phone = phone.slice(0, 30);
  }
  if (config.sendEmail && email) {
    payload.sendEmail = true;
  }

  return payload;
}

function taxFields(config: SmartbillInvoiceConfig): Pick<
  SmartbillProductLine,
  'isTaxIncluded' | 'taxName' | 'taxPercentage'
> {
  if (!config.vatPayer) {
    return {};
  }
  return {
    isTaxIncluded: true,
    taxName: config.taxName,
    taxPercentage: config.taxPercentage,
  };
}

function serviceLine(
  name: string,
  price: number,
  config: SmartbillInvoiceConfig,
): SmartbillProductLine {
  return {
    name,
    isDiscount: false,
    measuringUnitName: config.measuringUnitName,
    currency: CURRENCY,
    quantity: 1,
    price,
    ...taxFields(config),
    saveToDb: false,
    isService: true,
  };
}
