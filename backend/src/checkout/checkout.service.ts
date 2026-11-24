import { Injectable, BadRequestException, Logger, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Ipn } from 'netopia-payment2';
import { existsSync, readFileSync, readdirSync } from 'fs';
import * as path from 'path';
import { CartService } from '../cart/cart.service';
import { ProductsService } from '../products/products.service';
import { UsersService } from '../users/users.service';
import { EmailService } from '../email/email.service';
import { OrdersService } from '../orders/orders.service';
import { OrderBillingDetails } from '../orders/entities/order.entity';
import { OrderPaymentStatus, PaymentMethod } from '../common/enums/order-status.enum';
import { ArtistsService } from '../artists/artists.service';
import { StockReservationsService } from '../stock-reservations/stock-reservations.service';
import { CartHolder } from '../stock-reservations/types/cart-holder.type';
import {
  NETOPIA_STATUS_CONFIRMED,
  NETOPIA_STATUS_PAID,
  cardPaymentMatchesOrder,
} from './card-payment-match.util';
import {
  DeliveryMethod,
  SiteSettingsService,
} from '../site-settings/site-settings.service';

type OrderContact = {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
};

const MAX_ORDER_LINES = 15;
const MAX_LINE_QUANTITY = 10;

function escapeHtml(value: unknown): string {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
const ROMANIA_COUNTRY_CODE = 642;
const ROMANIA_COUNTRY_NAME = 'Romania';

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
  artistId: number;
  artistDisplayName: string;
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
    private ordersService: OrdersService,
    private artistsService: ArtistsService,
    private stockReservationsService: StockReservationsService,
    private siteSettingsService: SiteSettingsService,
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

  private hasCompleteAddress(fields: {
    county?: string | null;
    city?: string | null;
    street?: string | null;
    postalCode?: string | null;
    postal_code?: string | null;
  }): boolean {
    const postal = fields.postalCode || fields.postal_code;
    return !!(fields.county && fields.city && fields.street && postal);
  }

  private resolveCheckoutPhone(
    user: { phone?: string | null },
    deliveryAddress?: { recipientPhone?: string },
    billingDetails?: BillingDetailsDto,
  ): string {
    return (
      user.phone?.trim() ||
      deliveryAddress?.recipientPhone?.trim() ||
      billingDetails?.phone?.trim() ||
      ''
    );
  }

  private resolveCheckoutDeliveryAddress(
    user: {
      county?: string | null;
      city?: string | null;
      street?: string | null;
      postal_code?: string | null;
      first_name: string;
      last_name: string;
      phone?: string | null;
    },
    phone: string,
    deliveryAddress?: {
      county: string;
      city: string;
      street: string;
      postalCode: string;
      recipientName?: string;
      recipientPhone?: string;
      lockerId?: string;
    },
  ) {
    if (deliveryAddress && this.hasCompleteAddress(deliveryAddress)) {
      return {
        county: deliveryAddress.county,
        city: deliveryAddress.city,
        street: deliveryAddress.street,
        postalCode: deliveryAddress.postalCode,
        recipientPhone: deliveryAddress.recipientPhone || phone,
        recipientName:
          deliveryAddress.recipientName ||
          `${user.first_name} ${user.last_name}`.trim(),
        lockerId: deliveryAddress.lockerId,
      };
    }
    if (this.hasCompleteAddress(user)) {
      return {
        county: user.county as string,
        city: user.city as string,
        street: user.street as string,
        postalCode: user.postal_code as string,
        recipientPhone: phone,
        recipientName: `${user.first_name} ${user.last_name}`.trim(),
        lockerId: undefined,
      };
    }
    return null;
  }

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
        this.logger.error(
          'IPN Netopia respins: lipseste certificatul public. Pune fisierul .cer in NETOPIA_PUBLIC_KEY_PATH.',
        );
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
    if (inline?.includes('BEGIN CERTIFICATE') || inline?.includes('BEGIN PUBLIC KEY')) {
      return inline.replace(/\\n/g, '\n');
    }
    if (inline?.trim()) {
      this.logger.warn(
        'NETOPIA_PUBLIC_KEY nu este un certificat PEM si este ignorat.',
      );
    }
    const keyPath = this.configService.get<string>('NETOPIA_PUBLIC_KEY_PATH');
    if (keyPath) {
      const resolvedPath = this.resolveConfigPath(keyPath);
      if (existsSync(resolvedPath)) {
        this.logger.log(`Certificat Netopia: ${resolvedPath}`);
        return readFileSync(resolvedPath, 'utf8');
      }
      this.logger.error(`Certificat Netopia inexistent: ${resolvedPath}`);
    }

    const certsDirectories = [
      path.join(process.cwd(), 'certs'),
      path.join(process.cwd(), 'backend', 'certs'),
    ];
    for (const directory of certsDirectories) {
      if (!existsSync(directory)) {
        continue;
      }
      const certificateName = readdirSync(directory).find((fileName) =>
        fileName.toLowerCase().endsWith('.cer'),
      );
      if (!certificateName) {
        continue;
      }
      const certificatePath = path.join(directory, certificateName);
      this.logger.log(`Certificat Netopia: ${certificatePath}`);
      return readFileSync(certificatePath, 'utf8');
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

  getEasyboxPluginConfig(): {
    enabled: boolean;
    clientId: string;
    apiUsername: string;
  } {
    const clientId =
      this.configService.get<string>('SAMEDAY_LOCKER_CLIENT_ID')?.trim() ?? '';
    const apiUsername =
      this.configService.get<string>('SAMEDAY_API_USERNAME')?.trim() ?? '';
    const enabled = clientId.length > 0 && apiUsername.length > 0;
    return {
      enabled,
      clientId: enabled ? clientId : '',
      apiUsername: enabled ? apiUsername : '',
    };
  }

  private streetForMethod(
    method: DeliveryMethod,
    street: string,
    lockerId?: string,
  ): string {
    const trimmed = street.trim();
    if (method !== 'EASYBOX') {
      return trimmed;
    }
    const withLocker = lockerId?.trim()
      ? `#${lockerId.trim()} ${trimmed}`
      : trimmed;
    if (/^easybox\b/i.test(withLocker)) {
      return withLocker;
    }
    return `Easybox: ${withLocker}`;
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
    deliveryFeeRon: number;
  }): Promise<{ url: string; orderId: string }> {
    const subtotal = payload.items.reduce((sum, i) => sum + i.lineTotalRon, 0);
    const totalRon = Number((subtotal + payload.deliveryFeeRon).toFixed(2));
    const backendUrl = this.getBackendUrl();

    const configData = {
      emailTemplate: '',
      emailSubject: '',
      cancelUrl: payload.cancelUrl,
      notifyUrl: `${backendUrl}/checkout/ipn`,
      redirectUrl: payload.successUrl,
      language: 'ro',
    };
    this.logger.log(
      `Netopia notifyUrl=${configData.notifyUrl} redirectUrl=${configData.redirectUrl}`,
    );
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
          price: payload.deliveryFeeRon,
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

    try {
      const startedNtpId = new URL(paymentURL).searchParams.get('p')?.trim();
      if (startedNtpId) {
        const canonicalNtpId = await this.resolveNetopiaNtpId(
          payload.orderId,
          startedNtpId,
        );
        await this.ordersService.updateNetopiaNtpId(
          payload.orderId,
          canonicalNtpId || startedNtpId,
        );
      }
    } catch (error) {
      this.logger.warn(
        `Nu am putut salva ntpID pentru ${payload.orderId}: ${error}`,
      );
    }

    return { url: paymentURL, orderId: payload.orderId };
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

  private isGiftOrder(
    orderPlacer: OrderContact,
    recipientName?: string,
  ): boolean {
    const normalizedRecipient = (recipientName || '').trim();
    if (!normalizedRecipient) {
      return false;
    }
    const placerName =
      `${orderPlacer.firstName} ${orderPlacer.lastName}`.trim().toLowerCase();
    return placerName !== normalizedRecipient.toLowerCase();
  }

  private placerToMetadata(
    orderPlacer: OrderContact,
    isGift: boolean,
  ): Record<string, string> {
    if (!isGift) {
      return { isGift: '0' };
    }
    return {
      isGift: '1',
      orderPlacerFirstName: orderPlacer.firstName,
      orderPlacerLastName: orderPlacer.lastName,
      orderPlacerEmail: orderPlacer.email,
      orderPlacerPhone: orderPlacer.phone,
    };
  }

  private orderPlacerFromMetadata(
    metadata?: Record<string, string> | null,
  ): OrderContact | undefined {
    if (metadata?.isGift !== '1') {
      return undefined;
    }
    return {
      firstName: metadata.orderPlacerFirstName || '',
      lastName: metadata.orderPlacerLastName || '',
      email: metadata.orderPlacerEmail || '',
      phone: metadata.orderPlacerPhone || '',
    };
  }

  private formatOrderPlacerHtml(orderPlacer?: OrderContact): string {
    if (!orderPlacer) {
      return '';
    }
    return `
      <h3>Comandat de (cont)</h3>
      <p>
        ${escapeHtml(orderPlacer.firstName)} ${escapeHtml(orderPlacer.lastName)}<br/>
        Email: ${escapeHtml(orderPlacer.email || '-')}<br/>
        Telefon: ${escapeHtml(orderPlacer.phone || '-')}
      </p>
    `;
  }

  private formatDeliveryHtml(customer: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    county: string;
    city: string;
    street: string;
    postalCode: string;
  }, isGift: boolean): string {
    const title = isGift ? 'Date livrare (destinatar cadou)' : 'Date livrare';
    return `
      <h3>${title}</h3>
      <p>
        ${escapeHtml(customer.firstName)} ${escapeHtml(customer.lastName)}<br/>
        Email: ${escapeHtml(customer.email)}<br/>
        Telefon: ${escapeHtml(customer.phone)}<br/>
        Adresa: ${escapeHtml(customer.street)}, ${escapeHtml(customer.city)}, ${escapeHtml(customer.county)}, ${escapeHtml(customer.postalCode)}
      </p>
    `;
  }

  private formatBillingHtml(billing?: BillingDetailsDto): string {
    if (!billing?.type) return '';
    if (billing.type === 'company') {
      return `
      <h3>Date facturare (persoana juridica)</h3>
      <p>
        Firma: ${escapeHtml(billing.companyName || '-')}<br/>
        CUI: ${escapeHtml(billing.cui || '-')}<br/>
        Reg. Comert: ${escapeHtml(billing.tradeRegister || '-')}<br/>
        Adresa: ${escapeHtml(billing.street || '-')}
      </p>
    `;
    }
    return `
      <h3>Date facturare (persoana fizica)</h3>
      <p>
        ${escapeHtml(billing.firstName || '')} ${escapeHtml(billing.lastName || '')}<br/>
        Email: ${escapeHtml(billing.email || '-')}<br/>
        Telefon: ${escapeHtml(billing.phone || '-')}<br/>
        Adresa: ${escapeHtml(billing.street || '')}, ${escapeHtml(billing.city || '')}, ${escapeHtml(billing.county || '')}, ${escapeHtml(billing.postalCode || '')}
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
      cui: String(company.cui || normalizedCui),
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
      lockerId?: string;
    },
    billingDetails?: BillingDetailsDto,
    deliveryMethod?: string,
  ): Promise<{ url: string; orderId: string }> {
    const user = await this.usersService.findOne(userId);
    if (!user) {
      throw new BadRequestException('User not found');
    }

    const phone = this.resolveCheckoutPhone(user, deliveryAddress, billingDetails);
    if (!phone) {
      throw new BadRequestException(
        'Completeaza numarul de telefon inainte de finalizarea comenzii.',
      );
    }

    const effectiveAddress = this.resolveCheckoutDeliveryAddress(
      user,
      phone,
      deliveryAddress,
    );
    if (!effectiveAddress) {
      throw new BadRequestException(
        'Completeaza adresa de livrare inainte de finalizarea comenzii.',
      );
    }

    const cartItems = await this.cartService.findAll(userId);
    if (!cartItems.length) {
      throw new BadRequestException('Cart is empty');
    }

    const items = await this.buildOrderItems(cartItems, {
      type: 'user',
      userId,
    });
    if (!items.length) {
      throw new BadRequestException('No valid products in cart');
    }

    const recipientParts = (effectiveAddress.recipientName || '').split(' ');
    const method = this.siteSettingsService.parseDeliveryMethod(
      deliveryMethod ?? 'ADDRESS',
    );
    const deliveryFeeRon = await this.siteSettingsService.feeFor(method);
    const deliveryStreet = this.streetForMethod(
      method,
      effectiveAddress.street,
      effectiveAddress.lockerId,
    );
    const subtotal = items.reduce((sum, i) => sum + i.lineTotalRon, 0);
    const totalRon = Number((subtotal + deliveryFeeRon).toFixed(2));
    const orderPlacer: OrderContact = {
      firstName: user.first_name,
      lastName: user.last_name,
      email: user.email,
      phone,
    };
    const isGift = this.isGiftOrder(
      orderPlacer,
      effectiveAddress.recipientName,
    );

    const persistedOrder = await this.ordersService.createCardOrder({
      userId,
      customer: {
        firstName: recipientParts[0] || user.first_name,
        lastName: recipientParts.slice(1).join(' ') || user.last_name,
        email: user.email,
        phone: effectiveAddress.recipientPhone || user.phone || '',
        county: effectiveAddress.county,
        city: effectiveAddress.city,
        street: deliveryStreet,
        postalCode: effectiveAddress.postalCode,
        recipientName: effectiveAddress.recipientName,
        recipientPhone: effectiveAddress.recipientPhone,
      },
      billingDetails: this.toOrderBillingDetails(billingDetails),
      items,
      subtotalRon: subtotal,
      deliveryFeeRon,
      cashOperationalFeeRon: 0,
      totalRon,
    });

    return this.createNetopiaPayment({
      orderId: persistedOrder.publicOrderNumber,
      items,
      customer: this.toNetopiaContact({
        email: user.email,
        phone: effectiveAddress.recipientPhone || user.phone || '',
        firstName: recipientParts[0] || user.first_name,
        lastName: recipientParts.slice(1).join(' ') || user.last_name,
        city: effectiveAddress.city,
        county: effectiveAddress.county,
        street: deliveryStreet,
        postalCode: effectiveAddress.postalCode,
      }),
      shipping: this.toNetopiaContact({
        email: user.email,
        phone: effectiveAddress.recipientPhone || user.phone || '',
        firstName: recipientParts[0] || user.first_name,
        lastName: recipientParts.slice(1).join(' ') || user.last_name,
        city: effectiveAddress.city,
        county: effectiveAddress.county,
        street: deliveryStreet,
        postalCode: effectiveAddress.postalCode,
      }),
      successUrl,
      cancelUrl,
      deliveryFeeRon,
      metadata: {
        userId: String(userId),
        customerType: 'user',
        deliveryCounty: effectiveAddress.county,
        deliveryCity: effectiveAddress.city,
        deliveryMethod: method,
        deliveryLockerId: effectiveAddress.lockerId?.trim() || '',
        deliveryStreet,
        deliveryPostalCode: effectiveAddress.postalCode,
        deliveryRecipientName: effectiveAddress.recipientName || '',
        deliveryRecipientPhone: effectiveAddress.recipientPhone || '',
        ...this.placerToMetadata(orderPlacer, isGift),
        ...this.billingToMetadata(billingDetails),
      },
    });
  }

  async createCheckoutSessionForGuest(
    payload: {
      successUrl: string;
      cancelUrl: string;
      guestCartId?: string;
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
        lockerId?: string;
      };
      billingDetails?: BillingDetailsDto;
      deliveryMethod?: string;
    },
  ): Promise<{ url: string; orderId: string }> {
    this.validateGuestContact(payload.guest);

    if (!Array.isArray(payload.items) || payload.items.length === 0) {
      throw new BadRequestException('Cart is empty');
    }

    const guestHolder = payload.guestCartId?.trim()
      ? { type: 'guest' as const, guestId: payload.guestCartId.trim() }
      : undefined;

    const items = await this.buildOrderItems(payload.items, guestHolder);
    if (!items.length) {
      throw new BadRequestException('No valid products in cart');
    }

    const method = this.siteSettingsService.parseDeliveryMethod(
      payload.deliveryMethod ?? 'ADDRESS',
    );
    const deliveryFeeRon = await this.siteSettingsService.feeFor(method);
    const deliveryStreet = this.streetForMethod(
      method,
      payload.guest.street,
      payload.guest.lockerId,
    );
    const subtotal = items.reduce((sum, i) => sum + i.lineTotalRon, 0);
    const totalRon = Number((subtotal + deliveryFeeRon).toFixed(2));

    const persistedOrder = await this.ordersService.createCardOrder({
      userId: null,
      customer: {
        firstName: payload.guest.firstName,
        lastName: payload.guest.lastName,
        email: payload.guest.email,
        phone: payload.guest.phone,
        county: payload.guest.county,
        city: payload.guest.city,
        street: deliveryStreet,
        postalCode: payload.guest.postalCode,
      },
      billingDetails: this.toOrderBillingDetails(payload.billingDetails),
      items,
      subtotalRon: subtotal,
      deliveryFeeRon,
      cashOperationalFeeRon: 0,
      totalRon,
    });

    return this.createNetopiaPayment({
      orderId: persistedOrder.publicOrderNumber,
      items,
      customer: this.toNetopiaContact({
        email: payload.guest.email,
        phone: payload.guest.phone,
        firstName: payload.guest.firstName,
        lastName: payload.guest.lastName,
        city: payload.guest.city,
        county: payload.guest.county,
        street: deliveryStreet,
        postalCode: payload.guest.postalCode,
      }),
      shipping: this.toNetopiaContact({
        email: payload.guest.email,
        phone: payload.guest.phone,
        firstName: payload.guest.firstName,
        lastName: payload.guest.lastName,
        city: payload.guest.city,
        county: payload.guest.county,
        street: deliveryStreet,
        postalCode: payload.guest.postalCode,
      }),
      successUrl: payload.successUrl,
      cancelUrl: payload.cancelUrl,
      deliveryFeeRon,
      metadata: {
        customerType: 'guest',
        deliveryMethod: method,
        guestCartId: payload.guestCartId?.trim() || '',
        guestFirstName: payload.guest.firstName,
        guestLastName: payload.guest.lastName,
        guestEmail: payload.guest.email,
        guestPhone: payload.guest.phone,
        guestCounty: payload.guest.county,
        guestCity: payload.guest.city,
        guestStreet: deliveryStreet,
        guestPostalCode: payload.guest.postalCode,
        deliveryLockerId: payload.guest.lockerId?.trim() || '',
        ...this.billingToMetadata(payload.billingDetails),
      },
    });
  }

  private toOrderBillingDetails(
    billing?: BillingDetailsDto,
  ): OrderBillingDetails | null {
    if (!billing) {
      return null;
    }
    return billing as OrderBillingDetails;
  }

  private validateGuestContact(guest: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    county: string;
    city: string;
    street: string;
    postalCode: string;
  }): void {
    for (const field of this.REQUIRED_GUEST_FIELDS) {
      const value = guest[field]?.trim() || '';
      if (!value) {
        throw new BadRequestException(`Camp obligatoriu lipsa: ${field}`);
      }
      if (value.length > 300) {
        throw new BadRequestException(`Camp prea lung: ${field}`);
      }
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(guest.email.trim())) {
      throw new BadRequestException('Email invalid');
    }
  }

  private async buildOrderItems(
    items: { productId: number; quantity: number }[],
    holder?: CartHolder,
  ): Promise<OrderItemSnapshot[]> {
    if (items.length > MAX_ORDER_LINES) {
      throw new BadRequestException('Cosul depaseste numarul maxim de produse.');
    }
    await this.stockReservationsService.releaseExpired();
    const result: OrderItemSnapshot[] = [];
    for (const item of items) {
      if (!Number.isInteger(item.productId) || item.productId < 1) continue;
      if (
        !Number.isInteger(item.quantity) ||
        item.quantity < 1 ||
        item.quantity > MAX_LINE_QUANTITY
      ) {
        throw new BadRequestException('Cantitatea comandata nu este permisa.');
      }
      const product = await this.productsService.findOnePublic(item.productId);
      if (!product) continue;
      const availableStock =
        await this.stockReservationsService.getAvailableForHolder(
          product,
          holder,
        );
      if (availableStock <= 0) {
        throw new BadRequestException(
          `Produsul "${product.title}" nu mai este in stoc.`,
        );
      }
      if (item.quantity > availableStock) {
        throw new BadRequestException(
          `Cantitatea pentru "${product.title}" depaseste stocul disponibil.`,
        );
      }
      const unitPriceRon = Number(product.price);
      result.push({
        productId: item.productId,
        artistId: product.artistId,
        artistDisplayName: product.artist?.displayName ?? 'Maini in Lut',
        title: product.title,
        quantity: item.quantity,
        unitPriceRon,
        lineTotalRon: unitPriceRon * item.quantity,
        imageUrl: product.image
          ? this.toAbsoluteImageUrl(product.image)
          : undefined,
      });
    }
    return result;
  }

  private async sendOrderNotification(payload: {
    orderId: string;
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
    orderPlacer?: OrderContact;
    isGift?: boolean;
    billingDetails?: BillingDetailsDto;
    items: {
      productId: number;
      artistId: number;
      title: string;
      quantity: number;
      unitPriceRon: number;
      lineTotalRon: number;
      imageUrl?: string;
    }[];
    subtotalRon: number;
    deliveryFeeRon: number;
    totalRon: number;
  }): Promise<void> {
    const adminEmail =
      this.configService.get<string>('ORDER_NOTIFICATION_EMAIL') ||
      this.configService.get<string>('SMTP_FROM_EMAIL');
    const isGift = !!payload.isGift && !!payload.orderPlacer;
    const buildItemRows = (
      orderItems: typeof payload.items,
    ) =>
      orderItems
        .map(
          (i) =>
            `<tr><td style="padding:6px 8px;border:1px solid #ddd;">${escapeHtml(i.title)}</td><td style="padding:6px 8px;border:1px solid #ddd;">${escapeHtml(i.quantity)}</td><td style="padding:6px 8px;border:1px solid #ddd;">${escapeHtml(i.unitPriceRon)} RON</td><td style="padding:6px 8px;border:1px solid #ddd;">${escapeHtml(i.lineTotalRon)} RON</td></tr>`,
        )
        .join('');
    const itemRows = buildItemRows(payload.items);
    const billingHtml = this.formatBillingHtml(payload.billingDetails);
    const orderPlacerHtml = this.formatOrderPlacerHtml(
      isGift ? payload.orderPlacer : undefined,
    );
    const deliveryHtml = this.formatDeliveryHtml(payload.customer, isGift);
    const paymentLabel = 'Card';
    const adminHtml = `
      <h2>Comanda noua (${escapeHtml(payload.orderId)})</h2>
      <p><strong>Metoda plata:</strong> ${escapeHtml(paymentLabel)}</p>
      ${isGift ? '<p><strong>Tip comanda:</strong> Cadou</p>' : ''}
      ${orderPlacerHtml}
      ${deliveryHtml}
      ${billingHtml}
      <h3>Produse</h3>
      <table style="border-collapse:collapse;">
        <thead><tr><th style="padding:6px 8px;border:1px solid #ddd;">Produs</th><th style="padding:6px 8px;border:1px solid #ddd;">Cantitate</th><th style="padding:6px 8px;border:1px solid #ddd;">Pret</th><th style="padding:6px 8px;border:1px solid #ddd;">Total</th></tr></thead>
        <tbody>${itemRows}</tbody>
      </table>
      <p style="margin-top:12px;">
        Subtotal: ${payload.subtotalRon} RON<br/>
        Livrare: ${payload.deliveryFeeRon} RON<br/>
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
              ? `<a href="${escapeHtml(productLink)}" target="_blank" rel="noopener noreferrer"><img src="${escapeHtml(i.imageUrl)}" alt="${escapeHtml(i.title)}" style="width:72px;height:72px;object-fit:cover;border-radius:8px;border:1px solid #e5e7eb;" /></a>`
              : `<img src="${escapeHtml(i.imageUrl)}" alt="${escapeHtml(i.title)}" style="width:72px;height:72px;object-fit:cover;border-radius:8px;border:1px solid #e5e7eb;" />`
            : '';
          const titleHtml = productLink
            ? `<a href="${escapeHtml(productLink)}" target="_blank" rel="noopener noreferrer" style="font-weight:600;color:#1f2937;text-decoration:none;">${escapeHtml(i.title)}</a>`
            : `<div style="font-weight:600;color:#1f2937;">${escapeHtml(i.title)}</div>`;
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
        <h2 style="margin:0 0 8px;">Iti multumim pentru comanda, ${escapeHtml(isGift && payload.orderPlacer ? payload.orderPlacer.firstName : payload.customer.firstName)}!</h2>
        <p style="margin:0 0 14px;color:#4b5563;">
          Iti multumim ca ai ales Maini in lut. Inseamna foarte mult pentru noi fiecare comanda si fiecare client care sustine munca noastra.
        </p>
        <p style="margin:0 0 14px;color:#4b5563;">
          Comanda ta <strong>${escapeHtml(payload.orderId)}</strong> a fost inregistrata cu succes.
        </p>

        <h3 style="margin:16px 0 8px;">Produse comandate</h3>
        <table style="width:100%;border-collapse:collapse;">
          <tbody>${customerItemsHtml}</tbody>
        </table>

        <h3 style="margin:16px 0 8px;">${isGift ? 'Detalii livrare (destinatar cadou)' : 'Detalii livrare'}</h3>
        <p style="margin:0 0 14px;color:#4b5563;">
          ${escapeHtml(payload.customer.firstName)} ${escapeHtml(payload.customer.lastName)}<br/>
          Telefon: ${escapeHtml(payload.customer.phone)}<br/>
          Adresa: ${escapeHtml(payload.customer.street)}, ${escapeHtml(payload.customer.city)}, ${escapeHtml(payload.customer.county)}, ${escapeHtml(payload.customer.postalCode)}
        </p>

        <h3 style="margin:16px 0 8px;">Total de plata</h3>
        <p style="margin:0;color:#111827;">
          Subtotal: ${payload.subtotalRon} RON<br/>
          Livrare: ${payload.deliveryFeeRon} RON<br/>
          <strong style="font-size:18px;">Total: ${payload.totalRon} RON</strong>
        </p>

        <h3 style="margin:16px 0 8px;">Recomandare de folosire</h3>
        <p style="margin:0;color:#4b5563;">
          Pentru a pastra produsele in cea mai buna stare, recomandam manipularea cu grija, curatarea blanda (fara abrazivi) si evitarea socurilor termice.
        </p>
      </div>
    `;
    if (adminEmail) {
      await this.emailService.sendOrderNotificationEmail(
        adminEmail,
        `Comanda noua ${payload.orderId}`,
        adminHtml,
      );
    }

    const itemsByArtist = new Map<number, typeof payload.items>();
    for (const item of payload.items) {
      const current = itemsByArtist.get(item.artistId) || [];
      current.push(item);
      itemsByArtist.set(item.artistId, current);
    }

    for (const [artistId, artistItems] of itemsByArtist.entries()) {
      const artist = await this.artistsService.findByIdWithUser(artistId);
      const artistEmail = artist?.user?.email;
      if (!artistEmail) {
        continue;
      }

      const artistItemRows = buildItemRows(artistItems);
      const artistSubtotal = artistItems.reduce(
        (sum, item) => sum + item.lineTotalRon,
        0,
      );
      const artistHtml = `
        <h2>Comanda noua pentru produsele tale (${payload.orderId})</h2>
        <p><strong>Metoda plata:</strong> ${escapeHtml(paymentLabel)}</p>
        ${isGift ? '<p><strong>Tip comanda:</strong> Cadou</p>' : ''}
        ${orderPlacerHtml}
        ${deliveryHtml}
        <h3>Produsele tale</h3>
        <table style="border-collapse:collapse;">
          <thead><tr><th style="padding:6px 8px;border:1px solid #ddd;">Produs</th><th style="padding:6px 8px;border:1px solid #ddd;">Cantitate</th><th style="padding:6px 8px;border:1px solid #ddd;">Pret</th><th style="padding:6px 8px;border:1px solid #ddd;">Total</th></tr></thead>
          <tbody>${artistItemRows}</tbody>
        </table>
        <p style="margin-top:12px;">
          <strong>Subtotal produse tale: ${artistSubtotal} RON</strong>
        </p>
      `;

      await this.emailService.sendOrderNotificationEmail(
        artistEmail,
        `Comanda noua ${payload.orderId} - ${artist?.displayName || 'Artist'}`,
        artistHtml,
      );
    }

    if (payload.customer.email || payload.orderPlacer?.email) {
      const confirmationEmail =
        isGift && payload.orderPlacer?.email
          ? payload.orderPlacer.email
          : payload.customer.email;
      if (!confirmationEmail) {
        return;
      }
      await this.emailService.sendOrderNotificationEmail(
        confirmationEmail,
        `Confirmare comanda ${payload.orderId}`,
        customerHtml,
      );
    }
  }

  private getBackendUrl(): string {
    const backendUrl = this.configService.get<string>('BACKEND_URL')?.trim();
    if (!backendUrl) {
      throw new Error('BACKEND_URL lipseste din backend/.env');
    }
    return backendUrl.replace(/\/$/, '');
  }

  private toAbsoluteImageUrl(path: string): string {
    const backendBase = this.getBackendUrl();
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

  async getCardOrderStatus(publicOrderNumber: string): Promise<{
    orderId: string;
    paymentStatus: string;
  }> {
    const order = await this.ordersService.findByPublicOrderNumber(
      publicOrderNumber,
    );
    if (!order) {
      throw new NotFoundException('Comanda nu a fost gasita.');
    }
    return {
      orderId: order.publicOrderNumber,
      paymentStatus: order.paymentStatus.toLowerCase(),
    };
  }

  async handleIpn(
    verificationToken: string,
    rawData: string,
    payload: Record<string, unknown>,
  ): Promise<void> {
    this.logger.log('Netopia IPN received');
    const verified = await this.getIpn().verify(verificationToken, rawData);
    const signatureOk = verified.errorType === 0;
    this.logger.log(
      `Netopia IPN result errorType=${verified.errorType} status=${verified.status} message=${verified.errorMessage || ''}`,
    );

    const reportedOrder = payload.order as { orderID?: string } | undefined;
    const reportedPayment = payload.payment as { ntpID?: string } | undefined;
    const orderId = reportedOrder?.orderID?.trim();
    if (!orderId) {
      throw new BadRequestException('IPN Netopia fara numar de comanda.');
    }

    const localOrder = await this.ordersService.findByPublicOrderNumber(orderId);
    if (!localOrder || localOrder.paymentMethod !== PaymentMethod.CARD) {
      throw new BadRequestException('Comanda din IPN nu exista.');
    }

    const confirmedByNetopia = await this.netopiaPaymentIsPaid(
      localOrder,
      reportedPayment?.ntpID,
    );
    if (confirmedByNetopia) {
      await this.processCardPaymentNotification(payload, signatureOk);
      return;
    }

    if (!signatureOk) {
      throw new BadRequestException(
        verified.errorMessage || 'Verificarea IPN Netopia a esuat.',
      );
    }

    if (
      verified.status !== NETOPIA_STATUS_PAID &&
      verified.status !== NETOPIA_STATUS_CONFIRMED
    ) {
      this.logger.warn(
        `Netopia IPN ignored because payment is not confirmed (status=${verified.status}).`,
      );
      return;
    }

    this.logger.warn(
      `IPN semnat pentru ${orderId}, dar statusul autentificat Netopia nu confirma plata.`,
    );
  }

  private async resolveNetopiaNtpId(
    orderId: string,
    startedNtpId: string,
  ): Promise<string> {
    const apiKey = this.getNetopiaApiKey();
    const posSignature = this.getNetopiaPosSignature();
    if (!apiKey || !posSignature) {
      return startedNtpId;
    }

    const response = await fetch(
      `${this.getNetopiaBaseUrl()}/operation/status`,
      {
        method: 'POST',
        headers: {
          Authorization: apiKey,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          posID: posSignature,
          orderID: orderId,
          ntpID: startedNtpId,
        }),
      },
    );
    const data = (await response.json().catch(() => null)) as {
      order?: { orderID?: string };
      payment?: { ntpID?: string | number };
    } | null;
    const responseOrderId = data?.order?.orderID?.trim();
    const responseNtpId = String(data?.payment?.ntpID ?? '').trim();
    if (responseOrderId === orderId && responseNtpId) {
      return responseNtpId;
    }
    return startedNtpId;
  }

  private async netopiaPaymentIsPaid(
    order: {
      publicOrderNumber: string;
      totalRon: number | string;
      netopiaNtpId: string | null;
    },
    hintedNtpId?: string,
  ): Promise<boolean> {
    const storedNtpId = order.netopiaNtpId?.trim();
    const reportedNtpId = String(hintedNtpId ?? '').trim();
    const ntpId = reportedNtpId || storedNtpId;
    if (!ntpId) {
      this.logger.warn(
        `Lipseste ntpID pentru confirmarea comenzii ${order.publicOrderNumber}.`,
      );
      return false;
    }
    if (storedNtpId && reportedNtpId && storedNtpId !== reportedNtpId) {
      this.logger.warn(
        `ntpID salvat difera de cel din IPN pentru ${order.publicOrderNumber}. Confirm prin statusul Netopia.`,
      );
    }

    const apiKey = this.getNetopiaApiKey();
    const posSignature = this.getNetopiaPosSignature();
    if (!apiKey || !posSignature) {
      return false;
    }

    const response = await fetch(
      `${this.getNetopiaBaseUrl()}/operation/status`,
      {
        method: 'POST',
        headers: {
          Authorization: apiKey,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          posID: posSignature,
          orderID: order.publicOrderNumber,
          ntpID: ntpId,
        }),
      },
    );
    const data = (await response.json().catch(() => null)) as {
      error?: { code?: string; message?: string };
      order?: { orderID?: string; amount?: number; currency?: string };
      payment?: { status?: number; amount?: number; ntpID?: string };
    } | null;

    const paymentStatus = Number(data?.payment?.status);
    const responseOrderId = data?.order?.orderID?.trim();
    const responseNtpId = data?.payment?.ntpID?.trim();
    const amount = Number(data?.payment?.amount ?? data?.order?.amount);
    const currency = data?.order?.currency;
    this.logger.log(
      `Netopia status API http=${response.status} order=${order.publicOrderNumber} paymentStatus=${paymentStatus} orderMatch=${responseOrderId === order.publicOrderNumber} error=${data?.error?.code || ''}`,
    );

    if (!response.ok || !data) {
      return false;
    }
    if (
      !cardPaymentMatchesOrder({
        responseOrderId,
        expectedOrderId: order.publicOrderNumber,
        responseNtpId,
        expectedNtpId: ntpId,
        currency,
        amount,
        expectedTotal: Number(order.totalRon),
        paymentStatus,
      })
    ) {
      return false;
    }

    if (!storedNtpId) {
      await this.ordersService.updateNetopiaNtpId(
        order.publicOrderNumber,
        responseNtpId || ntpId,
      );
    }
    return true;
  }

  private async processCardPaymentNotification(
    payload: Record<string, unknown>,
    trustMetadata = true,
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

    const existingOrder = await this.ordersService.findByPublicOrderNumber(
      order.orderID,
    );
    if (
      existingOrder?.paymentStatus === OrderPaymentStatus.PAID &&
      existingOrder.stockFulfilledAt &&
      existingOrder.confirmationSentAt
    ) {
      return;
    }

    const metadata = trustMetadata ? order.data || {} : {};
    let items: OrderItemSnapshot[] = [];
    if (metadata.itemsJson) {
      try {
        items = JSON.parse(metadata.itemsJson) as OrderItemSnapshot[];
      } catch {
        items = [];
      }
    }

    const paidOrder = await this.ordersService.markCardOrderPaid(order.orderID);
    if (paidOrder?.items?.length) {
      items = paidOrder.items.map((item) => ({
        productId: item.productId,
        artistId: item.artistId,
        artistDisplayName: item.artistDisplayName,
        title: item.title,
        quantity: item.quantity,
        unitPriceRon: Number(item.unitPriceRon),
        lineTotalRon: Number(item.lineTotalRon),
        imageUrl: item.image ? this.toAbsoluteImageUrl(item.image) : undefined,
      }));
    }

    if (items.length && !paidOrder?.stockFulfilledAt) {
      const userId = paidOrder?.userId
      ? Number(paidOrder.userId)
      : metadata.userId
        ? Number(metadata.userId)
        : null;
      const guestCartId = metadata.guestCartId?.trim();
      const holder: CartHolder | undefined =
        userId && Number.isFinite(userId)
          ? { type: 'user', userId }
          : guestCartId
            ? { type: 'guest', guestId: guestCartId }
            : undefined;
      await this.stockReservationsService.fulfillOrder(
        order.orderID,
        items.map((item) => ({
          productId: item.productId,
          quantity: item.quantity,
        })),
        holder,
      );
    }

    const billing = order.billing;
    const orderPlacer = this.orderPlacerFromMetadata(metadata);
    const isGift = metadata.isGift === '1' && !!orderPlacer;
    const subtotal = items.reduce((sum, i) => sum + i.lineTotalRon, 0);
    const fallbackFee = paidOrder
      ? Number(paidOrder.deliveryFeeRon)
      : await this.siteSettingsService.feeFor('ADDRESS');
    const totalRon = Number(
      (payment?.amount ?? order.amount ?? subtotal + fallbackFee).toFixed(2),
    );
    const deliveryFeeRon = Number((totalRon - subtotal).toFixed(2));

    if (!paidOrder?.confirmationSentAt) {
      await this.sendOrderNotification({
        orderId: order.orderID,
        customer: {
          firstName:
            paidOrder?.customerFirstName ||
            metadata.deliveryRecipientName?.split(' ')[0] ||
            metadata.guestFirstName ||
            billing?.firstName ||
            'Client',
          lastName:
            paidOrder?.customerLastName ||
            metadata.deliveryRecipientName?.split(' ').slice(1).join(' ') ||
            metadata.guestLastName ||
            billing?.lastName ||
            '',
          email:
            paidOrder?.customerEmail ||
            metadata.guestEmail ||
            metadata.deliveryRecipientEmail ||
            billing?.email ||
            orderPlacer?.email ||
            '',
          phone:
            paidOrder?.customerPhone ||
            metadata.deliveryRecipientPhone ||
            metadata.guestPhone ||
            billing?.phone ||
            '',
          county:
            paidOrder?.deliveryCounty ||
            metadata.deliveryCounty ||
            metadata.guestCounty ||
            billing?.state ||
            '',
          city:
            paidOrder?.deliveryCity ||
            metadata.deliveryCity ||
            metadata.guestCity ||
            billing?.city ||
            '',
          street:
            paidOrder?.deliveryStreet ||
            metadata.deliveryStreet ||
            metadata.guestStreet ||
            billing?.details ||
            '',
          postalCode:
            paidOrder?.deliveryPostalCode ||
            metadata.deliveryPostalCode ||
            metadata.guestPostalCode ||
            billing?.postalCode ||
            '',
        },
        orderPlacer,
        isGift,
        billingDetails:
          this.billingFromMetadata(metadata) ||
          (paidOrder?.billingDetails as BillingDetailsDto | undefined),
        items,
        subtotalRon: subtotal,
        deliveryFeeRon: deliveryFeeRon > 0 ? deliveryFeeRon : fallbackFee,
        totalRon,
      });
      await this.ordersService.markConfirmationSent(order.orderID);
    }

    const userId = paidOrder?.userId
      ? Number(paidOrder.userId)
      : metadata.userId
        ? Number(metadata.userId)
        : null;
    if (userId && Number.isFinite(userId)) {
      await this.cartService.clearCart(userId);
    }
  }
}
