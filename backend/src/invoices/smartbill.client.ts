import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SmartbillInvoicePayload } from './smartbill-invoice.builder';

const SMARTBILL_INVOICE_URL = 'https://ws.smartbill.ro/SBORO/api/invoice/v2';
const REQUEST_TIMEOUT_MS = 20_000;

export type SmartbillIssuedInvoice = {
  series: string;
  number: string | null;
  documentId: number | null;
  documentUrl: string | null;
  documentViewUrl: string | null;
  draft: boolean;
};

type SmartbillInvoiceResponse = {
  errorText?: string;
  message?: string;
  number?: string;
  series?: string;
  documentUrl?: string;
  documentId?: number;
  documentViewUrl?: string;
};

export class SmartbillRequestError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'SmartbillRequestError';
  }
}

@Injectable()
export class SmartbillClient {
  constructor(private readonly configService: ConfigService) {}

  async createInvoice(payload: SmartbillInvoicePayload): Promise<SmartbillIssuedInvoice> {
    const email = this.configService.get<string>('SMARTBILL_EMAIL')?.trim() ?? '';
    const token = this.configService.get<string>('SMARTBILL_TOKEN')?.trim() ?? '';
    if (!email || !token) {
      throw new SmartbillRequestError('SmartBill nu este configurat.');
    }

    let response: Response;
    try {
      response = await fetch(SMARTBILL_INVOICE_URL, {
        method: 'POST',
        headers: {
          Authorization: `Basic ${Buffer.from(`${email}:${token}`).toString('base64')}`,
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify(payload),
        signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
      });
    } catch {
      throw new SmartbillRequestError('SmartBill nu a răspuns.');
    }

    const body = (await response.json().catch(() => ({}))) as SmartbillInvoiceResponse;
    const errorText = body.errorText?.trim() || body.message?.trim() || '';
    if (!response.ok || errorText) {
      throw new SmartbillRequestError(errorText || 'SmartBill a respins factura.');
    }
    if (!body.series) {
      throw new SmartbillRequestError('SmartBill nu a întors seria facturii.');
    }
    const number = body.number?.trim() || null;
    const documentId = typeof body.documentId === 'number' ? body.documentId : null;
    const documentViewUrl = body.documentViewUrl?.trim() || null;
    if (!payload.isDraft && !number) {
      throw new SmartbillRequestError('SmartBill nu a întors numărul facturii.');
    }
    if (payload.isDraft && !number && documentId === null && !documentViewUrl) {
      throw new SmartbillRequestError('SmartBill nu a întors ciorna.');
    }

    return {
      series: body.series,
      number,
      documentId,
      documentUrl: body.documentUrl?.trim() || null,
      documentViewUrl,
      draft: payload.isDraft,
    };
  }
}
