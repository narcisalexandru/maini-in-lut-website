import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Ipn } from 'netopia-payment2';
import { existsSync, readFileSync } from 'fs';
import * as path from 'path';
import Mail from 'nodemailer/lib/mailer';
import { CartService } from '../cart/cart.service';
import { ProductsService } from '../products/products.service';
import { UsersService } from '../users/users.service';
import { EmailService } from '../email/email.service';

const DELIVERY_FEE_RON = 15;
const CASH_OPERATIONAL_FEE_RON = 5;
const ROMANIA_COUNTRY_CODE = 642;
const ROMANIA_COUNTRY_NAME = 'Romania';
const NETOPIA_STATUS_PAID = 3;
const NETOPIA_STATUS_CONFIRMED = 5;

export type BillingDetailsDto = {
  type?: 'individual' | 'company';
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  companyName?: string;
  cui?: string;
  tradeRegister?: string;
  county?: string;
  city?: string;
  street?: string;
  postalCode?: string;
};

type OrderItemSnapshot = {
  productId: number;
  title: string;
  quantity: number;
  unitPriceRon: number;
  lineTotalRon: number;
  imageUrl?: string;
};

type NetopiaContact = {
  email: string;
  phone: string;
  firstName: string;
  lastName: string;
  city: string;
  state: string;
  postalCode: string;
  details: string;
};

@Injectable()
export class CheckoutService {
  private readonly logger = new Logger(CheckoutService.name);
  private ipn: Ipn | null = null;

  constructor(
    private configService: ConfigService,
    private cartService: CartService,
    private productsService: ProductsService,
    private usersService: UsersService,
    private emailService: EmailService,
  ) {}

  private readonly REQUIRED_GUEST_FIELDS = [
    'firstName',
    'lastName',
    'email',
    'phone',
    'county',
    'city',
    'street',
    'postalCode',
  ] as const;

  private getNetopiaApiKey(): string {
    return (
      this.configService.get<string>('NETOPIA_API_KEY') ||
      this.configService.get<string>('NETOPIA_POS_KEY') ||
      ''
    ).trim();
  }

  private getNetopiaPosSignature(): string {
    return this.configService.get<string>('NETOPIA_POS_SIGNATURE')?.trim() || '';
  }

  private getNetopiaBaseUrl(): string {
    const isLive =
      this.configService.get<string>('NETOPIA_IS_LIVE') === 'true';
    return isLive
      ? 'https://secure.netopia-payments.com'
      : 'https://secure-sandbox.netopia-payments.com';
  }

  private resolveConfigPath(configPath: string): string {
    if (path.isAbsolute(configPath)) {
      return configPath;
    }
    const normalized = configPath.replace(/^\.\//, '');
    const candidates = [
      path.join(process.cwd(), configPath),
      path.join(process.cwd(), normalized),
      path.join(process.cwd(), 'backend', normalized),
    ];
    for (const candidate of candidates) {
      if (existsSync(candidate)) {
        return candidate;
      }
    }
    return path.join(process.cwd(), configPath);
  }

  private getIpn(): Ipn {
    if (!this.ipn) {
      const posSignature = this.getNetopiaPosSignature();
      const publicKeyStr = this.loadNetopiaPublicKey();
      if (!posSignature || !publicKeyStr) {
        throw new BadRequestException(
          'NETOPIA_POS_SIGNATURE si certificatul public Netopia trebuie configurate in .env.',
        );
      }
      this.ipn = new Ipn({
        posSignature,
        posSignatureSet: [posSignature],
        publicKeyStr,
        hashMethod: 'sha512',
        alg: 'RS512',
      });
    }
    return this.ipn;
  }

  private loadNetopiaPublicKey(): string {
    const inline = this.configService.get<string>('NETOPIA_PUBLIC_KEY');
    if (inline?.includes('BEGIN CERTIFICATE')) {
      return inline.replace(/\\n/g, '\n');
    }
    const keyPath = this.configService.get<string>('NETOPIA_PUBLIC_KEY_PATH');
    if (keyPath) {
      const resolvedPath = this.resolveConfigPath(keyPath);
      if (existsSync(resolvedPath)) {
        return readFileSync(resolvedPath, 'utf8');
      }
    }
    return '';
  }

  private async startNetopiaPayment(payload: {
    configData: Record<string, string>;
    paymentData: Record<string, unknown>;
    orderData: Record<string, unknown>;
  }): Promise<{ paymentURL: string }> {
    const apiKey = this.getNetopiaApiKey();
    const posSignature = this.getNetopiaPosSignature();
    if (!apiKey || !posSignature) {
      throw new BadRequestException(
        'NETOPIA_API_KEY si NETOPIA_POS_SIGNATURE trebuie configurate in backend/.env.',
      );
    }

    const requestBody = {
      config: payload.configData,
      payment: payload.paymentData,
      order: {
        ...payload.orderData,
        ntpID: payload.orderData.ntpID || null,
        posSignature,
      },
    };

    const response = await fetch(
      `${this.getNetopiaBaseUrl()}/payment/card/start`,
      {
        method: 'POST',
        headers: {
          Authorization: apiKey,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      },
    );

    const data = (await response.json().catch(() => ({}))) as {
      code?: string | number;
      message?: string;
      payment?: { paymentURL?: string };
      error?: { code?: string; message?: string; details?: unknown[] };
    };

    if (response.status === 401) {
      throw new BadRequestException(
        'Netopia a respins cheia API (401 Unauthorized). Genereaza o cheie noua din admin.netopia-payments.com > Profil > Securitate, asigura-te ca esti in sandbox si actualizeaza NETOPIA_API_KEY in backend/.env.',
      );
    }

    if (!response.ok) {
      const details = Array.isArray(data.error?.details)
        ? data.error.details
            .map((item) => {
              if (!item || typeof item !== 'object') return '';
              const detail = item as { field?: string; message?: string };
              return detail.field
                ? `${detail.field}: ${detail.message || ''}`
                : detail.message || '';
            })
            .filter(Boolean)
            .join('; ')
        : '';
      const message =
        data.error?.message ||
        data.message ||
        `Netopia a returnat status ${response.status}.`;
      this.logger.warn(`Netopia start payment failed: ${JSON.stringify(data)}`);
      throw new BadRequestException(
        details ? `${message} (${details})` : message,
      );
    }

    const paymentUrl = data.payment?.paymentURL;
    if (!paymentUrl) {
      this.logger.warn(
        `Netopia start payment missing paymentURL: ${JSON.stringify(data)}`,
      );
      throw new BadRequestException(
        data.error?.message ||
          'Netopia nu a returnat URL-ul de plata. Verifica configurarea punctului de vanzare.',
      );
    }

    return { paymentURL: paymentUrl };
  }

  private formatNetopiaDateTime(date = new Date()): string {
    return date.toISOString().slice(0, 19);
  }

  private toNetopiaContact(payload: {
    email: string;
    phone: string;
    firstName: string;
    lastName: string;
    city: string;
    county: string;
    street: string;
    postalCode: string;
  }): NetopiaContact {
    return {
      email: payload.email,
      phone: payload.phone,
      firstName: payload.firstName,
      lastName: payload.lastName,
      city: payload.city,
      state: payload.county,
      postalCode: payload.postalCode,
      details: payload.street,
    };
  }

  private wrapNetopiaContact(contact: NetopiaContact) {
    return {
      ...contact,
      country: ROMANIA_COUNTRY_CODE,
      countryName: ROMANIA_COUNTRY_NAME,
    };
  }

  private async createNetopiaPayment(payload: {
    orderId: string;
    items: OrderItemSnapshot[];
    customer: NetopiaContact;
    shipping: NetopiaContact;
    successUrl: string;
    cancelUrl: string;
    metadata: Record<string, string>;
  }): Promise<{ url: string }> {
    const subtotal = payload.items.reduce((sum, i) => sum + i.lineTotalRon, 0);
    const totalRon = Number((subtotal + DELIVERY_FEE_RON).toFixed(2));
    const backendUrl =
      this.configService.get('BACKEND_URL') || 'http://localhost:4000';

    const configData = {
      emailTemplate: '',
      emailSubject: '',
      cancelUrl: payload.cancelUrl,
      notifyUrl: `${backendUrl}/checkout/ipn`,
      redirectUrl: payload.successUrl,
      language: 'ro',
    };
    const paymentData = {
      options: {
        installments: 0,
        bonus: 0,
        split: [],
      },
      instrument: {
        type: 'card',
        account: '',
        expMonth: 0,
        expYear: 0,
        secretCode: '',
        token: '',
        clientID: '',
      },
      data: {},
    };
    const orderData = {
      ntpID: '',
      posSignature: '',
      orderID: payload.orderId,
      description: `Comanda ${payload.orderId}`,
      amount: totalRon,
      currency: 'RON',
      dateTime: this.formatNetopiaDateTime(),
      billing: this.wrapNetopiaContact(payload.customer),
      shipping: this.wrapNetopiaContact(payload.shipping),
      products: [
        ...payload.items.map((item) => ({
          name: item.title,
          code: String(item.productId),
          category: 'Produse',
          price: item.unitPriceRon,
          vat: 0,
        })),
        {
          name: 'Livrare',
          code: 'delivery',
          category: 'Transport',
          price: DELIVERY_FEE_RON,
          vat: 0,
        },
      ],
      installments: {
        selected: 0,
        available: [0],
      },
      data: {
        ...payload.metadata,
        itemsJson: JSON.stringify(payload.items),
      },
    };

    const { paymentURL } = await this.startNetopiaPayment({
      configData,
      paymentData,
      orderData,
    });

    return { url: paymentURL };
  }

  private billingToMetadata(
    billing?: BillingDetailsDto,
  ): Record<string, string> {
    if (!billing?.type) return {};
    const metadata: Record<string, string> = {
      billingType: billing.type,
    };
    if (billing.type === 'company') {
      metadata.billingCompanyName = (billing.companyName || '').slice(0, 500);
      metadata.billingCui = billing.cui || '';
      metadata.billingTradeRegister = (billing.tradeRegister || '').slice(0, 500);
      metadata.billingStreet = (billing.street || '').slice(0, 500);
    } else {
      metadata.billingFirstName = billing.firstName || '';
      metadata.billingLastName = billing.lastName || '';
      metadata.billingEmail = billing.email || '';
      metadata.billingPhone = billing.phone || '';
      metadata.billingStreet = (billing.street || '').slice(0, 500);
      metadata.billingCity = billing.city || '';
      metadata.billingCounty = billing.county || '';
      metadata.billingPostalCode = billing.postalCode || '';
    }
    return metadata;
  }

  private billingFromMetadata(
    metadata?: Record<string, string> | null,
  ): BillingDetailsDto | undefined {
    if (!metadata?.billingType) return undefined;
    if (metadata.billingType === 'company') {
      return {
        type: 'company',
        companyName: metadata.billingCompanyName || '',
        cui: metadata.billingCui || '',
        tradeRegister: metadata.billingTradeRegister || '',
        street: metadata.billingStreet || '',
      };
    }
    return {
      type: 'individual',
      firstName: metadata.billingFirstName || '',
      lastName: metadata.billingLastName || '',
      email: metadata.billingEmail || '',
      phone: metadata.billingPhone || '',
      street: metadata.billingStreet || '',
      city: metadata.billingCity || '',
      county: metadata.billingCounty || '',
      postalCode: metadata.billingPostalCode || '',
    };
  }

  private formatBillingHtml(billing?: BillingDetailsDto): string {
    if (!billing?.type) return '';
    if (billing.type === 'company') {
      return `
      <h3>Date facturare (persoana juridica)</h3>
      <p>
        Firma: ${billing.companyName || '-'}<br/>
        CUI: ${billing.cui || '-'}<br/>
        Reg. Comert: ${billing.tradeRegister || '-'}<br/>
        Adresa: ${billing.street || '-'}
      </p>
    `;
    }
    return `
      <h3>Date facturare (persoana fizica)</h3>
      <p>
        ${billing.firstName || ''} ${billing.lastName || ''}<br/>
        Email: ${billing.email || '-'}<br/>
        Telefon: ${billing.phone || '-'}<br/>
        Adresa: ${billing.street || ''}, ${billing.city || ''}, ${billing.county || ''}, ${billing.postalCode || ''}
      </p>
    `;
  }

  async lookupCompanyByCui(cui: string): Promise<{
    name: string;
    cui: string;
    tradeRegister: string;
    address: string;
  }> {
    const normalizedCui = String(cui || '').replace(/\D/g, '');
    if (!normalizedCui) {
      throw new BadRequestException('CUI invalid');
    }
    const today = new Date().toISOString().slice(0, 10);
    const res = await fetch(
      'https://webservicesp.anaf.ro/api/PlatitorTvaRest/v9/tva',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify([{ cui: Number(normalizedCui), data: today }]),
      },
    );
    if (!res.ok) {
      throw new BadRequestException('Nu s-au putut prelua datele firmei');
    }
    const data = (await res.json()) as {
      found?: {
        date_generale?: {
          denumire?: string;
          cui?: string;
          nrRegCom?: string;
          adresa?: string;
        };
      }[];
    };
    const company = data?.found?.[0]?.date_generale;
    if (!company?.denumire) {
      throw new BadRequestException('Firma nu a fost gasita pentru CUI-ul introdus');
    }
    return {
      name: company.denumire || '',
      cui: company.cui || normalizedCui,
      tradeRegister: company.nrRegCom || '',
      address: company.adresa || '',
    };
  }

  async createCheckoutSessionForUser(
    userId: number,
    successUrl: string,
    cancelUrl: string,
    deliveryAddress?: {
      label?: string;
      county: string;
      city: string;
      street: string;
      postalCode: string;
      recipientName?: string;
      recipientPhone?: string;
    },
    billingDetails?: BillingDetailsDto,
  ): Promise<{ url: string }> {
    const user = await this.usersService.findOne(userId);
    if (!user) {
      throw new BadRequestException('User not found');
    }

    if (!user.county || !user.city || !user.street || !user.postal_code) {
      throw new BadRequestException(
        'Completeaza adresa in cont inainte de finalizarea comenzii.',
      );
    }

    const cartItems = await this.cartService.findAll(userId);
    if (!cartItems.length) {
      throw new BadRequestException('Cart is empty');
    }

    const items = await this.buildOrderItems(cartItems);
    if (!items.length) {
      throw new BadRequestException('No valid products in cart');
    }

    const effectiveAddress = deliveryAddress || {
      county: user.county,
      city: user.city,
      street: user.street,
      postalCode: user.postal_code,
      recipientPhone: user.phone || '',
      recipientName: `${user.first_name} ${user.last_name}`.trim(),
    };

    const recipientParts = (effectiveAddress.recipientName || '').split(' ');
    const orderId = `MIL-${Date.now()}`;

    return this.createNetopiaPayment({
      orderId,
      items,
      customer: this.toNetopiaContact({
        email: user.email,
        phone: effectiveAddress.recipientPhone || user.phone || '',
        firstName: recipientParts[0] || user.first_name,
        lastName: recipientParts.slice(1).join(' ') || user.last_name,
        city: effectiveAddress.city,
        county: effectiveAddress.county,
        street: effectiveAddress.street,
        postalCode: effectiveAddress.postalCode,
      }),
      shipping: this.toNetopiaContact({
        email: user.email,
        phone: effectiveAddress.recipientPhone || user.phone || '',
        firstName: recipientParts[0] || user.first_name,
        lastName: recipientParts.slice(1).join(' ') || user.last_name,
        city: effectiveAddress.city,
        county: effectiveAddress.county,
        street: effectiveAddress.street,
        postalCode: effectiveAddress.postalCode,
      }),
      successUrl,
      cancelUrl,
      metadata: {
        userId: String(userId),
        customerType: 'user',
        deliveryCounty: effectiveAddress.county,
        deliveryCity: effectiveAddress.city,
        deliveryStreet: effectiveAddress.street,
        deliveryPostalCode: effectiveAddress.postalCode,
        deliveryRecipientName: effectiveAddress.recipientName || '',
        deliveryRecipientPhone: effectiveAddress.recipientPhone || '',
        ...this.billingToMetadata(billingDetails),
      },
    });
  }

  async createCashOrderForUser(
    userId: number,
    deliveryAddress?: {
      label?: string;
      county: string;
      city: string;
      street: string;
      postalCode: string;
      recipientName?: string;
      recipientPhone?: string;
    },
    billingDetails?: BillingDetailsDto,
  ): Promise<{ success: true; message: string; orderId: string }> {
    const user = await this.usersService.findOne(userId);
    if (!user) throw new BadRequestException('User not found');
    if (!user.county || !user.city || !user.street || !user.postal_code) {
      throw new BadRequestException(
        'Completeaza adresa in cont inainte de finalizarea comenzii.',
      );
    }
    if (!user.phone) {
      throw new BadRequestException(
        'Completeaza numarul de telefon in cont inainte de finalizarea comenzii.',
      );
    }

    const cartItems = await this.cartService.findAll(userId);
    if (!cartItems.length) throw new BadRequestException('Cart is empty');

    const items = await this.buildOrderItems(cartItems);
    if (!items.length) throw new BadRequestException('No valid products in cart');

    const subtotal = items.reduce((sum, i) => sum + i.lineTotalRon, 0);
    const total = subtotal + DELIVERY_FEE_RON + CASH_OPERATIONAL_FEE_RON;
    const orderId = `COD-${Date.now()}`;

    const effectiveAddress = deliveryAddress || {
      county: user.county,
      city: user.city,
      street: user.street,
      postalCode: user.postal_code,
      recipientName: `${user.first_name} ${user.last_name}`.trim(),
      recipientPhone: user.phone,
    };

    await this.sendOrderNotification({
      orderId,
      paymentMethod: 'cash',
      customer: {
        firstName:
          effectiveAddress.recipientName?.split(' ').slice(0, 1).join(' ') ||
          user.first_name,
        lastName:
          effectiveAddress.recipientName?.split(' ').slice(1).join(' ') ||
          user.last_name,
        email: user.email,
        phone: effectiveAddress.recipientPhone || user.phone,
        county: effectiveAddress.county,
        city: effectiveAddress.city,
        street: effectiveAddress.street,
        postalCode: effectiveAddress.postalCode,
      },
      billingDetails,
      items,
      subtotalRon: subtotal,
      deliveryFeeRon: DELIVERY_FEE_RON,
      cashOperationalFeeRon: CASH_OPERATIONAL_FEE_RON,
      totalRon: total,
    });

    await this.cartService.clearCart(userId);
    return { success: true, message: 'Comanda plasata cu succes.', orderId };
  }

  async createCheckoutSessionForGuest(
    payload: {
      successUrl: string;
      cancelUrl: string;
      items: { productId: number; quantity: number }[];
      guest: {
        firstName: string;
        lastName: string;
        email: string;
        phone: string;
        county: string;
        city: string;
        street: string;
        postalCode: string;
      };
      billingDetails?: BillingDetailsDto;
    },
  ): Promise<{ url: string }> {
    for (const field of this.REQUIRED_GUEST_FIELDS) {
      if (!payload.guest[field]?.trim()) {
        throw new BadRequestException(`Camp obligatoriu lipsa: ${field}`);
      }
    }

    if (!Array.isArray(payload.items) || payload.items.length === 0) {
      throw new BadRequestException('Cart is empty');
    }

    const items = await this.buildOrderItems(payload.items);
    if (!items.length) {
      throw new BadRequestException('No valid products in cart');
    }

    const orderId = `MIL-${Date.now()}`;

    return this.createNetopiaPayment({
      orderId,
      items,
      customer: this.toNetopiaContact({
        email: payload.guest.email,
        phone: payload.guest.phone,
        firstName: payload.guest.firstName,
        lastName: payload.guest.lastName,
        city: payload.guest.city,
        county: payload.guest.county,
        street: payload.guest.street,
        postalCode: payload.guest.postalCode,
      }),
      shipping: this.toNetopiaContact({
        email: payload.guest.email,
        phone: payload.guest.phone,
        firstName: payload.guest.firstName,
        lastName: payload.guest.lastName,
        city: payload.guest.city,
        county: payload.guest.county,
        street: payload.guest.street,
        postalCode: payload.guest.postalCode,
      }),
      successUrl: payload.successUrl,
      cancelUrl: payload.cancelUrl,
      metadata: {
        customerType: 'guest',
        guestFirstName: payload.guest.firstName,
        guestLastName: payload.guest.lastName,
        guestPhone: payload.guest.phone,
        guestCounty: payload.guest.county,
        guestCity: payload.guest.city,
        guestStreet: payload.guest.street,
        guestPostalCode: payload.guest.postalCode,
        ...this.billingToMetadata(payload.billingDetails),
      },
    });
  }

  async createCashOrderForGuest(payload: {
    items: { productId: number; quantity: number }[];
    guest: {
      firstName: string;
      lastName: string;
      email: string;
      phone: string;
      county: string;
      city: string;
      street: string;
      postalCode: string;
    };
    billingDetails?: BillingDetailsDto;
  }): Promise<{ success: true; message: string; orderId: string }> {
    for (const field of this.REQUIRED_GUEST_FIELDS) {
      if (!payload.guest[field]?.trim()) {
        throw new BadRequestException(`Camp obligatoriu lipsa: ${field}`);
      }
    }
    if (!Array.isArray(payload.items) || payload.items.length === 0) {
      throw new BadRequestException('Cart is empty');
    }

    const items = await this.buildOrderItems(payload.items);
    if (!items.length) throw new BadRequestException('No valid products in cart');

    const subtotal = items.reduce((sum, i) => sum + i.lineTotalRon, 0);
    const total = subtotal + DELIVERY_FEE_RON + CASH_OPERATIONAL_FEE_RON;
    const orderId = `COD-${Date.now()}`;

    await this.sendOrderNotification({
      orderId,
      paymentMethod: 'cash',
      customer: payload.guest,
      billingDetails: payload.billingDetails,
      items,
      subtotalRon: subtotal,
      deliveryFeeRon: DELIVERY_FEE_RON,
      cashOperationalFeeRon: CASH_OPERATIONAL_FEE_RON,
      totalRon: total,
    });

    return { success: true, message: 'Comanda plasata cu succes.', orderId };
  }

  private async buildOrderItems(
    items: { productId: number; quantity: number }[],
  ): Promise<
    {
      productId: number;
      title: string;
      quantity: number;
      unitPriceRon: number;
      lineTotalRon: number;
      imageUrl?: string;
    }[]
  > {
    const result: {
      productId: number;
      title: string;
      quantity: number;
      unitPriceRon: number;
      lineTotalRon: number;
      imageUrl?: string;
    }[] = [];
    for (const item of items) {
      if (!Number.isInteger(item.productId) || item.quantity < 1) continue;
      const product = await this.productsService.findOne(item.productId);
      if (!product) continue;
      const unitPriceRon = Number(product.price);
      result.push({
        productId: item.productId,
        title: product.title,
        quantity: item.quantity,
        unitPriceRon,
        lineTotalRon: unitPriceRon * item.quantity,
        imageUrl: product.image ? this.toAbsoluteImageUrl(product.image) : undefined,
      });
    }
    return result;
  }

  private async sendOrderNotification(payload: {
    orderId: string;
    paymentMethod: 'cash' | 'card';
    customer: {
      firstName: string;
      lastName: string;
      email: string;
      phone: string;
      county: string;
      city: string;
      street: string;
      postalCode: string;
    };
    billingDetails?: BillingDetailsDto;
    items: {
      productId: number;
      title: string;
      quantity: number;
      unitPriceRon: number;
      lineTotalRon: number;
      imageUrl?: string;
    }[];
    subtotalRon: number;
    deliveryFeeRon: number;
    cashOperationalFeeRon: number;
    totalRon: number;
  }): Promise<void> {
    const adminEmail =
      this.configService.get<string>('ORDER_NOTIFICATION_EMAIL') ||
      this.configService.get<string>('SMTP_FROM_EMAIL');
    const itemRows = payload.items
      .map(
        (i) =>
          `<tr><td style="padding:6px 8px;border:1px solid #ddd;">${i.title}</td><td style="padding:6px 8px;border:1px solid #ddd;">${i.quantity}</td><td style="padding:6px 8px;border:1px solid #ddd;">${i.unitPriceRon} RON</td><td style="padding:6px 8px;border:1px solid #ddd;">${i.lineTotalRon} RON</td></tr>`,
      )
      .join('');
    const cashFeeRow =
      payload.cashOperationalFeeRon > 0
        ? `Taxa operationala cash: ${payload.cashOperationalFeeRon} RON<br/>`
        : '';
    const billingHtml = this.formatBillingHtml(payload.billingDetails);
    const adminHtml = `
      <h2>Comanda noua (${payload.orderId})</h2>
      <p><strong>Metoda plata:</strong> ${payload.paymentMethod}</p>
      <h3>Date livrare</h3>
      <p>
        ${payload.customer.firstName} ${payload.customer.lastName}<br/>
        Email: ${payload.customer.email}<br/>
        Telefon: ${payload.customer.phone}<br/>
        Adresa: ${payload.customer.street}, ${payload.customer.city}, ${payload.customer.county}, ${payload.customer.postalCode}
      </p>
      ${billingHtml}
      <h3>Produse</h3>
      <table style="border-collapse:collapse;">
        <thead><tr><th style="padding:6px 8px;border:1px solid #ddd;">Produs</th><th style="padding:6px 8px;border:1px solid #ddd;">Cantitate</th><th style="padding:6px 8px;border:1px solid #ddd;">Pret</th><th style="padding:6px 8px;border:1px solid #ddd;">Total</th></tr></thead>
        <tbody>${itemRows}</tbody>
      </table>
      <p style="margin-top:12px;">
        Subtotal: ${payload.subtotalRon} RON<br/>
        Livrare: ${payload.deliveryFeeRon} RON<br/>
        ${cashFeeRow}
        <strong>Total: ${payload.totalRon} RON</strong>
      </p>
    `;
    const customerItemsHtml = payload.items
      .map(
        (i) => {
          const productLink =
            i.productId > 0 ? this.getProductUrl(i.productId) : '';
          const imageHtml = i.imageUrl
            ? productLink
              ? `<a href="${productLink}" target="_blank" rel="noopener noreferrer"><img src="${i.imageUrl}" alt="${i.title}" style="width:72px;height:72px;object-fit:cover;border-radius:8px;border:1px solid #e5e7eb;" /></a>`
              : `<img src="${i.imageUrl}" alt="${i.title}" style="width:72px;height:72px;object-fit:cover;border-radius:8px;border:1px solid #e5e7eb;" />`
            : '';
          const titleHtml = productLink
            ? `<a href="${productLink}" target="_blank" rel="noopener noreferrer" style="font-weight:600;color:#1f2937;text-decoration:none;">${i.title}</a>`
            : `<div style="font-weight:600;color:#1f2937;">${i.title}</div>`;
          return `
        <tr>
          <td style="padding:8px;border-bottom:1px solid #eee;vertical-align:top;width:84px;">
            ${imageHtml}
          </td>
          <td style="padding:8px;border-bottom:1px solid #eee;vertical-align:top;">
            ${titleHtml}
            <div style="color:#6b7280;font-size:12px;">Cantitate: ${i.quantity}</div>
          </td>
          <td style="padding:8px;border-bottom:1px solid #eee;text-align:right;vertical-align:top;white-space:nowrap;">
            ${i.lineTotalRon} RON
          </td>
        </tr>`;
        },
      )
      .join('');
    const customerHtml = `
      <div style="font-family:Arial,Helvetica,sans-serif;color:#1f2937;line-height:1.45;">
        <h2 style="margin:0 0 8px;">Iti multumim pentru comanda, ${payload.customer.firstName}!</h2>
        <p style="margin:0 0 14px;color:#4b5563;">
          Iti multumim ca ai ales Maini in lut. Inseamna foarte mult pentru noi fiecare comanda si fiecare client care sustine munca noastra.
        </p>
        <p style="margin:0 0 14px;color:#4b5563;">
          Comanda ta <strong>${payload.orderId}</strong> a fost inregistrata cu succes.
        </p>

        <h3 style="margin:16px 0 8px;">Produse comandate</h3>
        <table style="width:100%;border-collapse:collapse;">
          <tbody>${customerItemsHtml}</tbody>
        </table>

        <h3 style="margin:16px 0 8px;">Detalii livrare</h3>
        <p style="margin:0 0 14px;color:#4b5563;">
          ${payload.customer.firstName} ${payload.customer.lastName}<br/>
          Telefon: ${payload.customer.phone}<br/>
          Adresa: ${payload.customer.street}, ${payload.customer.city}, ${payload.customer.county}, ${payload.customer.postalCode}
        </p>

        <h3 style="margin:16px 0 8px;">Total de plata</h3>
        <p style="margin:0;color:#111827;">
          Subtotal: ${payload.subtotalRon} RON<br/>
          Livrare: ${payload.deliveryFeeRon} RON<br/>
          ${cashFeeRow}
          <strong style="font-size:18px;">Total: ${payload.totalRon} RON</strong>
        </p>

        <h3 style="margin:16px 0 8px;">Recomandare de folosire</h3>
        <p style="margin:0;color:#4b5563;">
          Pentru a pastra produsele in cea mai buna stare, recomandam manipularea cu grija, curatarea blanda (fara abrazivi) si evitarea socurilor termice.
        </p>
      </div>
    `;
    const attachments: Mail.Attachment[] = [];
    let customerHtmlWithInlineImages = customerHtml;
    payload.items.forEach((item, index) => {
      if (!item.imageUrl) return;
      try {
        const parsed = new URL(item.imageUrl);
        if (!parsed.hostname.includes('localhost')) return;
        const relativeImagePath = decodeURIComponent(parsed.pathname.replace(/^\/+/, ''));
        const localImagePath = path.join(
          process.cwd(),
          '..',
          'frontend',
          'public',
          relativeImagePath,
        );
        if (!existsSync(localImagePath)) return;
        const cid = `product-image-${index}@mainiinlut`;
        attachments.push({
          filename: path.basename(localImagePath),
          path: localImagePath,
          cid,
        });
        customerHtmlWithInlineImages = customerHtmlWithInlineImages.replace(
          item.imageUrl,
          `cid:${cid}`,
        );
      } catch {
        // Keep the original URL when parsing fails.
      }
    });
    if (adminEmail) {
      await this.emailService.sendOrderNotificationEmail(
        adminEmail,
        `Comanda noua ${payload.orderId}`,
        adminHtml,
      );
    }
    if (payload.customer.email) {
      await this.emailService.sendOrderNotificationEmail(
        payload.customer.email,
        `Confirmare comanda ${payload.orderId}`,
        customerHtmlWithInlineImages,
        attachments,
      );
    }
  }

  private toAbsoluteImageUrl(path: string): string {
    const backendBase =
      this.configService.get('BACKEND_URL') || 'http://localhost:4000';
    const frontendBase =
      this.configService.get('FRONTEND_URL') || 'http://localhost:3000';
    if (path.startsWith('http')) return path;
    const base =
      path.startsWith('/uploads') || path.startsWith('uploads')
        ? backendBase
        : frontendBase;
    return path.startsWith('/') ? `${base}${path}` : `${base}/${path}`;
  }

  private getProductUrl(productId: number): string {
    const frontendBase =
      this.configService.get('FRONTEND_URL') || 'http://localhost:3000';
    return `${frontendBase}/produs/${productId}`;
  }

  async handleIpn(
    verificationToken: string,
    payload: Record<string, unknown>,
  ): Promise<void> {
    const rawData = JSON.stringify(payload);
    const status = await this.getIpn().verify(verificationToken, rawData);
    if (status.errorType !== 0) {
      throw new BadRequestException(
        status.errorMessage || 'Verificarea IPN Netopia a esuat.',
      );
    }

    const paymentStatus = status.status;
    if (
      paymentStatus !== NETOPIA_STATUS_PAID &&
      paymentStatus !== NETOPIA_STATUS_CONFIRMED
    ) {
      return;
    }

    await this.processCardPaymentNotification(payload);
  }

  private async processCardPaymentNotification(
    payload: Record<string, unknown>,
  ): Promise<void> {
    const order = payload.order as
      | {
          orderID?: string;
          amount?: number;
          data?: Record<string, string>;
          billing?: {
            email?: string;
            phone?: string;
            firstName?: string;
            lastName?: string;
            city?: string;
            state?: string;
            postalCode?: string;
            details?: string;
          };
        }
      | undefined;
    const payment = payload.payment as
      | { amount?: number; ntpID?: string }
      | undefined;

    if (!order?.orderID) return;

    const metadata = order.data || {};
    let items: OrderItemSnapshot[] = [];
    if (metadata.itemsJson) {
      try {
        items = JSON.parse(metadata.itemsJson) as OrderItemSnapshot[];
      } catch {
        items = [];
      }
    }

    const billing = order.billing;
    const subtotal = items.reduce((sum, i) => sum + i.lineTotalRon, 0);
    const totalRon = Number(
      (payment?.amount ?? order.amount ?? subtotal + DELIVERY_FEE_RON).toFixed(2),
    );
    const deliveryFeeRon = Number((totalRon - subtotal).toFixed(2));

    await this.sendOrderNotification({
      orderId: order.orderID,
      paymentMethod: 'card',
      customer: {
        firstName:
          metadata.deliveryRecipientName?.split(' ')[0] ||
          metadata.guestFirstName ||
          billing?.firstName ||
          'Client',
        lastName:
          metadata.deliveryRecipientName?.split(' ').slice(1).join(' ') ||
          metadata.guestLastName ||
          billing?.lastName ||
          '',
        email: billing?.email || metadata.billingEmail || '',
        phone:
          metadata.deliveryRecipientPhone ||
          metadata.guestPhone ||
          billing?.phone ||
          '',
        county:
          metadata.deliveryCounty ||
          metadata.guestCounty ||
          billing?.state ||
          '',
        city:
          metadata.deliveryCity || metadata.guestCity || billing?.city || '',
        street:
          metadata.deliveryStreet ||
          metadata.guestStreet ||
          billing?.details ||
          '',
        postalCode:
          metadata.deliveryPostalCode ||
          metadata.guestPostalCode ||
          billing?.postalCode ||
          '',
      },
      billingDetails: this.billingFromMetadata(metadata),
      items,
      subtotalRon: subtotal,
      deliveryFeeRon: deliveryFeeRon > 0 ? deliveryFeeRon : DELIVERY_FEE_RON,
      cashOperationalFeeRon: 0,
      totalRon,
    });

    const userId = metadata.userId ? Number(metadata.userId) : null;
    if (userId && Number.isFinite(userId)) {
      await this.cartService.clearCart(userId);
    }
  }
}
