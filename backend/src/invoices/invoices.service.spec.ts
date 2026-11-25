import { BadRequestException, ConflictException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { InvoiceStatus } from '../common/enums/invoice-status.enum';
import { OrderPaymentStatus, PaymentMethod } from '../common/enums/order-status.enum';
import { EmailService } from '../email/email.service';
import { Order } from '../orders/entities/order.entity';
import { InvoicesService } from './invoices.service';
import { SmartbillClient, SmartbillRequestError } from './smartbill.client';

describe('InvoicesService', () => {
  let service: InvoicesService;
  let ordersRepository: {
    findOne: jest.Mock;
    save: jest.Mock;
    createQueryBuilder: jest.Mock;
  };
  let execute: jest.Mock;
  let smartbillClient: { createInvoice: jest.Mock };
  let emailService: { sendOrderNotificationEmail: jest.Mock };
  const config = new Map<string, string>([
    ['SMARTBILL_EMAIL', 'facturi@example.com'],
    ['SMARTBILL_TOKEN', 'token'],
    ['SMARTBILL_COMPANY_VAT_CODE', 'RO123'],
    ['SMARTBILL_SERIES', 'MIL'],
    ['SMARTBILL_TAX_PERCENTAGE', '21'],
    ['SMARTBILL_AUTO_ISSUE', 'true'],
  ]);

  const paidOrder = () =>
    ({
      id: 4,
      publicOrderNumber: 'MIL-4',
      paymentMethod: PaymentMethod.CARD,
      paymentStatus: OrderPaymentStatus.PAID,
      customerFirstName: 'Ana',
      customerLastName: 'Pop',
      customerEmail: 'ana@example.com',
      customerPhone: '0700000000',
      deliveryCounty: 'Cluj',
      deliveryCity: 'Cluj-Napoca',
      deliveryStreet: 'Strada 1',
      deliveryPostalCode: '400000',
      billingDetails: null,
      deliveryFeeRon: 0,
      cashOperationalFeeRon: 0,
      invoiceStatus: null,
      invoiceSeries: null,
      invoiceNumber: null,
      invoiceDocumentId: null,
      invoiceDocumentUrl: null,
      invoiceViewUrl: null,
      invoiceError: null,
      invoiceIssuedAt: null,
      items: [{ productId: 1, title: 'Vas', quantity: 1, unitPriceRon: 80 }],
    }) as unknown as Order;

  beforeEach(async () => {
    execute = jest.fn().mockResolvedValue({ affected: 1 });
    ordersRepository = {
      findOne: jest.fn(),
      save: jest.fn().mockImplementation(async (order: Order) => order),
      createQueryBuilder: jest.fn().mockReturnValue({
        update: jest.fn().mockReturnThis(),
        set: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        execute,
      }),
    };
    smartbillClient = {
      createInvoice: jest.fn().mockResolvedValue({
        series: 'MIL',
        number: '15',
        documentId: 9,
        documentUrl: 'https://cloud.smartbill.ro/edit',
        documentViewUrl: 'https://cloud.smartbill.ro/view',
        draft: false,
      }),
    };
    emailService = { sendOrderNotificationEmail: jest.fn().mockResolvedValue(undefined) };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        InvoicesService,
        { provide: getRepositoryToken(Order), useValue: ordersRepository },
        {
          provide: ConfigService,
          useValue: { get: (key: string) => config.get(key) },
        },
        { provide: SmartbillClient, useValue: smartbillClient },
        { provide: EmailService, useValue: emailService },
      ],
    }).compile();

    service = module.get(InvoicesService);
  });

  it('returns an already issued invoice without calling SmartBill', async () => {
    const order = paidOrder();
    order.invoiceStatus = InvoiceStatus.ISSUED;
    order.invoiceSeries = 'MIL';
    order.invoiceNumber = '10';
    ordersRepository.findOne.mockResolvedValue(order);

    const result = await service.issueForOrder(4);

    expect(result.newlyIssued).toBe(false);
    expect(result.invoice.number).toBe('10');
    expect(smartbillClient.createInvoice).not.toHaveBeenCalled();
  });

  it('stores the SmartBill invoice and emails the public link', async () => {
    const order = paidOrder();
    ordersRepository.findOne.mockResolvedValue(order);

    const result = await service.issueForOrder(4);

    expect(result.newlyIssued).toBe(true);
    expect(result.invoice).toMatchObject({
      status: InvoiceStatus.ISSUED,
      series: 'MIL',
      number: '15',
      viewUrl: 'https://cloud.smartbill.ro/view',
    });
    expect(smartbillClient.createInvoice).toHaveBeenCalledWith(
      expect.objectContaining({
        companyVatCode: 'RO123',
        seriesName: 'MIL',
        payment: { value: 80, type: 'Card', isCash: false },
      }),
    );
    expect(emailService.sendOrderNotificationEmail).toHaveBeenCalled();
  });

  it('keeps the SmartBill error on the order when issuing fails', async () => {
    ordersRepository.findOne.mockResolvedValue(paidOrder());
    smartbillClient.createInvoice.mockRejectedValue(
      new SmartbillRequestError('CIF client invalid'),
    );

    await expect(service.issueForOrder(4)).rejects.toBeInstanceOf(BadRequestException);
    expect(ordersRepository.save).toHaveBeenCalledWith(
      expect.objectContaining({
        invoiceStatus: InvoiceStatus.FAILED,
        invoiceError: 'CIF client invalid',
      }),
    );
  });

  it('does not start a second issue while one is in progress', async () => {
    const order = paidOrder();
    order.invoiceStatus = InvoiceStatus.ISSUING;
    ordersRepository.findOne.mockResolvedValue(order);
    execute.mockResolvedValue({ affected: 0 });

    await expect(service.issueForOrder(4)).rejects.toBeInstanceOf(ConflictException);
    expect(smartbillClient.createInvoice).not.toHaveBeenCalled();
  });

  it('skips automatic issuing when SmartBill is not configured', async () => {
    config.clear();
    await service.issuePaidOrderSafely(4);
    expect(ordersRepository.findOne).not.toHaveBeenCalled();
  });
});
