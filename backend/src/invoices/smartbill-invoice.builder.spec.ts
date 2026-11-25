import { PaymentMethod } from '../common/enums/order-status.enum';
import {
  SmartbillInvoiceConfig,
  SmartbillInvoiceSource,
  buildSmartbillInvoice,
} from './smartbill-invoice.builder';

const config: SmartbillInvoiceConfig = {
  companyVatCode: 'RO12345678',
  seriesName: 'MIL',
  vatPayer: true,
  draft: false,
  taxName: 'Normala',
  taxPercentage: 21,
  measuringUnitName: 'buc',
  sendEmail: false,
};

function order(overrides: Partial<SmartbillInvoiceSource> = {}): SmartbillInvoiceSource {
  return {
    publicOrderNumber: 'MIL-1',
    paymentMethod: PaymentMethod.CARD,
    customerFirstName: 'Ana',
    customerLastName: 'Pop',
    customerEmail: 'ana@example.com',
    customerPhone: '0700000000',
    deliveryCounty: 'Cluj',
    deliveryCity: 'Cluj-Napoca',
    deliveryStreet: 'Strada Lalelelor 1',
    deliveryPostalCode: '400000',
    billingDetails: null,
    deliveryFeeRon: 15,
    cashOperationalFeeRon: 0,
    items: [
      {
        productId: 7,
        title: 'Vas ceramic',
        quantity: 2,
        unitPriceRon: 50,
      },
    ],
    ...overrides,
  };
}

describe('buildSmartbillInvoice', () => {
  it('issues a tax-included card invoice for a private customer', () => {
    const payload = buildSmartbillInvoice(order(), config, '2026-11-25');

    expect(payload.seriesName).toBe('MIL');
    expect(payload.isDraft).toBe(false);
    expect(payload.client.name).toBe('Ana Pop');
    expect(payload.client.vatCode).toBeUndefined();
    expect(payload.client.isTaxPayer).toBe(false);
    expect(payload.client.city).toBe('Cluj-Napoca');
    expect(payload.products[0]).toMatchObject({
      code: 'P7',
      quantity: 2,
      price: 50,
      isTaxIncluded: true,
      taxPercentage: 21,
      isService: false,
    });
    expect(payload.products[1]).toMatchObject({
      name: 'Transport',
      price: 15,
      isService: true,
    });
    expect(payload.payment).toEqual({ value: 115, type: 'Card', isCash: false });
    expect(payload.sendEmail).toBeUndefined();
  });

  it('marks a company with an RO fiscal code as a VAT payer', () => {
    const payload = buildSmartbillInvoice(
      order({
        billingDetails: {
          type: 'company',
          companyName: 'Atelier SRL',
          cui: 'RO 998877',
          street: 'Bd. Eroilor 2',
          city: 'Brașov',
          county: 'Brașov',
          postalCode: '500000',
        },
        deliveryFeeRon: 0,
      }),
      { ...config, sendEmail: true },
      '2026-11-25',
    );

    expect(payload.client).toMatchObject({
      name: 'Atelier SRL',
      vatCode: 'RO998877',
      isTaxPayer: true,
      city: 'Brașov',
      address: 'Bd. Eroilor 2, 500000',
    });
    expect(payload.products).toHaveLength(1);
    expect(payload.sendEmail).toBe(true);
  });

  it('records a cash collection without a receipt series', () => {
    const payload = buildSmartbillInvoice(
      order({
        paymentMethod: PaymentMethod.CASH,
        cashOperationalFeeRon: '3.50',
        deliveryFeeRon: 0,
        items: [{ productId: 1, title: 'Cană', quantity: 1, unitPriceRon: '10.00' }],
      }),
      config,
      '2026-11-25',
    );

    expect(payload.payment).toEqual({
      value: 13.5,
      type: 'Alta incasare',
      isCash: true,
    });
    expect(payload.products.map((line) => line.name)).toEqual([
      'Cană',
      'Taxă operațională ramburs',
    ]);
  });

  it('omits VAT fields when the company is not a VAT payer', () => {
    const payload = buildSmartbillInvoice(
      order(),
      { ...config, vatPayer: false, companyVatCode: '54003138' },
      '2026-11-25',
    );

    expect(payload.companyVatCode).toBe('54003138');
    expect(payload.products[0]).not.toHaveProperty('taxName');
    expect(payload.products[0]).not.toHaveProperty('taxPercentage');
    expect(payload.products[0]).not.toHaveProperty('isTaxIncluded');
    expect(payload.products[1]).not.toHaveProperty('taxPercentage');
    expect(payload.payment.value).toBe(115);
  });

  it('marks a non-VAT invoice as a draft', () => {
    const payload = buildSmartbillInvoice(
      order(),
      { ...config, vatPayer: false, draft: true },
      '2026-11-25',
    );

    expect(payload.isDraft).toBe(true);
    expect(payload.products[0]).not.toHaveProperty('taxName');
  });
});
