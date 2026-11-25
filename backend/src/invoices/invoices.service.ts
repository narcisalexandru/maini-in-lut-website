import {
  BadRequestException,
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { InvoiceStatus } from '../common/enums/invoice-status.enum';
import { OrderPaymentStatus } from '../common/enums/order-status.enum';
import { EmailService } from '../email/email.service';
import { Order } from '../orders/entities/order.entity';
import {
  SmartbillInvoiceConfig,
  buildSmartbillInvoice,
} from './smartbill-invoice.builder';
import { SmartbillClient, SmartbillRequestError } from './smartbill.client';

const ISSUE_LOCK_MS = 2 * 60 * 1000;
const ISSUE_TIME_ZONE = 'Europe/Bucharest';

export type OrderInvoiceView = {
  status: InvoiceStatus;
  series: string | null;
  number: string | null;
  viewUrl: string | null;
  documentUrl: string | null;
  isDraft: boolean;
  errorMessage: string | null;
  issuedAt: Date | null;
};

export type IssueInvoiceResult = {
  invoice: OrderInvoiceView;
  newlyIssued: boolean;
};

@Injectable()
export class InvoicesService {
  private readonly logger = new Logger(InvoicesService.name);

  constructor(
    @InjectRepository(Order)
    private readonly ordersRepository: Repository<Order>,
    private readonly configService: ConfigService,
    private readonly smartbillClient: SmartbillClient,
    private readonly emailService: EmailService,
  ) {}

  async issuePaidOrderSafely(orderId: number): Promise<void> {
    if (!this.isConfigured() || !this.isAutoIssueEnabled()) {
      return;
    }
    try {
      await this.issueForOrder(orderId);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Invoice issue failed';
      this.logger.error(`SmartBill invoice failed for order ${orderId}: ${message}`);
    }
  }

  async issueForOrder(orderId: number): Promise<IssueInvoiceResult> {
    const order = await this.findOrder(orderId);
    this.assertPayable(order);
    if (this.isIssued(order)) {
      return { invoice: this.toView(order), newlyIssued: false };
    }

    const claimed = await this.claimIssue(order.id);
    if (!claimed) {
      const current = await this.findOrder(orderId);
      if (this.isIssued(current)) {
        return { invoice: this.toView(current), newlyIssued: false };
      }
      throw new ConflictException('Factura este deja în curs de emitere.');
    }

    const fresh = await this.findOrder(orderId);
    try {
      const issued = await this.smartbillClient.createInvoice(
        buildSmartbillInvoice(fresh, this.readConfig(), this.issueDate()),
      );
      fresh.invoiceStatus = InvoiceStatus.ISSUED;
      fresh.invoiceSeries = issued.series;
      fresh.invoiceNumber = issued.number;
      fresh.invoiceDocumentId = issued.documentId;
      fresh.invoiceDocumentUrl = issued.documentUrl;
      fresh.invoiceViewUrl = issued.documentViewUrl;
      fresh.invoiceIsDraft = issued.draft;
      fresh.invoiceError = null;
      fresh.invoiceIssuedAt = new Date();
      await this.ordersRepository.save(fresh);
      await this.emailCustomer(fresh);
      return { invoice: this.toView(fresh), newlyIssued: true };
    } catch (error) {
      const message = this.errorMessage(error);
      fresh.invoiceStatus = InvoiceStatus.FAILED;
      fresh.invoiceError = message.slice(0, 2000);
      await this.ordersRepository.save(fresh);
      throw new BadRequestException(fresh.invoiceError);
    }
  }

  private async findOrder(orderId: number): Promise<Order> {
    const order = await this.ordersRepository.findOne({
      where: { id: orderId },
      relations: ['items'],
    });
    if (!order) {
      throw new NotFoundException('Order not found');
    }
    return order;
  }

  private assertPayable(order: Order): void {
    if (order.paymentStatus !== OrderPaymentStatus.PAID) {
      throw new BadRequestException('Factura se emite doar pentru comenzile încasate.');
    }
    if (!this.isConfigured()) {
      throw new BadRequestException(
        'SmartBill nu este configurat. Completează emailul, tokenul, CIF-ul și seria.',
      );
    }
  }

  private isIssued(order: Order): boolean {
    return (
      order.invoiceStatus === InvoiceStatus.ISSUED &&
      Boolean(order.invoiceNumber || order.invoiceDocumentId || order.invoiceViewUrl)
    );
  }

  private async claimIssue(orderId: number): Promise<boolean> {
    const staleBefore = new Date(Date.now() - ISSUE_LOCK_MS);
    const result = await this.ordersRepository
      .createQueryBuilder()
      .update(Order)
      .set({
        invoiceStatus: InvoiceStatus.ISSUING,
        invoiceAttemptAt: new Date(),
        invoiceError: null,
      })
      .where('id = :orderId', { orderId })
      .andWhere(
        `"invoiceStatus" IS NULL OR "invoiceStatus"::text = :failed OR ("invoiceStatus"::text = :issuing AND ("invoiceAttemptAt" IS NULL OR "invoiceAttemptAt" < :staleBefore))`,
        {
          failed: InvoiceStatus.FAILED,
          issuing: InvoiceStatus.ISSUING,
          staleBefore,
        },
      )
      .execute();
    return (result.affected ?? 0) > 0;
  }

  private readConfig(): SmartbillInvoiceConfig {
    const vatPayer = this.configService.get<string>('SMARTBILL_VAT_PAYER')?.trim() !== 'false';
    const taxPercentage = Number(this.configService.get<string>('SMARTBILL_TAX_PERCENTAGE') ?? '21');
    if (vatPayer && (!Number.isFinite(taxPercentage) || taxPercentage < 0)) {
      throw new BadRequestException('SMARTBILL_TAX_PERCENTAGE este invalid.');
    }
    return {
      companyVatCode: this.required('SMARTBILL_COMPANY_VAT_CODE'),
      seriesName: this.required('SMARTBILL_SERIES'),
      vatPayer,
      draft: this.configService.get<string>('SMARTBILL_DRAFT')?.trim() === 'true',
      taxName: this.configService.get<string>('SMARTBILL_TAX_NAME')?.trim() || 'Normala',
      taxPercentage: Number.isFinite(taxPercentage) ? taxPercentage : 0,
      measuringUnitName:
        this.configService.get<string>('SMARTBILL_MEASURING_UNIT')?.trim() || 'buc',
      sendEmail: this.configService.get<string>('SMARTBILL_SEND_EMAIL')?.trim() === 'true',
    };
  }

  private isConfigured(): boolean {
    return ['SMARTBILL_EMAIL', 'SMARTBILL_TOKEN', 'SMARTBILL_COMPANY_VAT_CODE', 'SMARTBILL_SERIES'].every(
      (key) => Boolean(this.configService.get<string>(key)?.trim()),
    );
  }

  private isAutoIssueEnabled(): boolean {
    return this.configService.get<string>('SMARTBILL_AUTO_ISSUE')?.trim() !== 'false';
  }

  private required(key: string): string {
    const value = this.configService.get<string>(key)?.trim();
    if (!value) {
      throw new BadRequestException('SmartBill nu este configurat.');
    }
    return value;
  }

  private issueDate(): string {
    return new Intl.DateTimeFormat('en-CA', {
      timeZone: ISSUE_TIME_ZONE,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).format(new Date());
  }

  private errorMessage(error: unknown): string {
    if (error instanceof SmartbillRequestError || error instanceof Error) {
      return error.message || 'Factura nu a putut fi emisă.';
    }
    return 'Factura nu a putut fi emisă.';
  }

  private async emailCustomer(order: Order): Promise<void> {
    if (order.invoiceIsDraft || !order.invoiceViewUrl || !order.customerEmail) {
      return;
    }
    const series = order.invoiceSeries ?? '';
    const number = order.invoiceNumber ?? '';
    const viewUrl = order.invoiceViewUrl;
    try {
      await this.emailService.sendOrderNotificationEmail(
        order.customerEmail,
        `Factură ${series} ${number}`.trim(),
        `<p>Factura pentru comanda ${escapeHtml(order.publicOrderNumber)} este ${escapeHtml(series)} ${escapeHtml(number)}.</p><p><a href="${escapeHtml(viewUrl)}">Descarcă factura</a></p>`,
      );
    } catch (error) {
      const message = error instanceof Error ? error.message : 'email failed';
      this.logger.error(`Invoice email failed for order ${order.id}: ${message}`);
    }
  }

  private toView(order: Order): OrderInvoiceView {
    return {
      status: order.invoiceStatus ?? InvoiceStatus.FAILED,
      series: order.invoiceSeries,
      number: order.invoiceNumber,
      viewUrl: order.invoiceViewUrl,
      documentUrl: order.invoiceDocumentUrl,
      isDraft: order.invoiceIsDraft,
      errorMessage: order.invoiceError,
      issuedAt: order.invoiceIssuedAt,
    };
  }
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
