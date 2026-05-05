import { Injectable, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Stripe from 'stripe';
import { CartService } from '../cart/cart.service';
import { ProductsService } from '../products/products.service';
import { UsersService } from '../users/users.service';

const DELIVERY_FEE_RON = 15;
const CURRENCY = 'ron';

@Injectable()
export class CheckoutService {
  private stripe: Stripe | null = null;

  constructor(
    private configService: ConfigService,
    private cartService: CartService,
    private productsService: ProductsService,
    private usersService: UsersService,
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

  private getStripe(): Stripe {
    if (!this.stripe) {
      const secretKey = this.configService.get<string>('STRIPE_SECRET_KEY');
      if (!secretKey) {
        throw new BadRequestException(
          'STRIPE_SECRET_KEY is not configured. Add it to .env to enable payments.',
        );
      }
      this.stripe = new Stripe(secretKey);
    }
    return this.stripe;
  }

  /**
   * RON amounts are in the smallest unit (bani): 1 RON = 100 bani.
   */
  private ronToBani(ron: number): number {
    return Math.round(ron * 100);
  }

  async createCheckoutSessionForUser(
    userId: number,
    successUrl: string,
    cancelUrl: string,
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

    const lineItems: Stripe.Checkout.SessionCreateParams.LineItem[] = [];

    for (const item of cartItems) {
      const product = await this.productsService.findOne(item.productId);
      if (!product) continue;

      const priceRon = Number(product.price);
      lineItems.push({
        price_data: {
          currency: CURRENCY,
          product_data: {
            name: product.title,
            description: (product.description || '').slice(0, 500),
            images: product.image ? [this.toAbsoluteImageUrl(product.image)] : undefined,
          },
          unit_amount: this.ronToBani(priceRon),
        },
        quantity: item.quantity,
      });
    }

    if (lineItems.length === 0) {
      throw new BadRequestException('No valid products in cart');
    }

    lineItems.push({
      price_data: {
        currency: CURRENCY,
        product_data: {
          name: 'Livrare',
          description: 'Cost livrare',
        },
        unit_amount: this.ronToBani(DELIVERY_FEE_RON),
      },
      quantity: 1,
    });

    const session = await this.getStripe().checkout.sessions.create({
      mode: 'payment',
      line_items: lineItems,
      success_url: successUrl,
      cancel_url: cancelUrl,
      customer_email: user.email,
      client_reference_id: String(userId),
      metadata: {
        userId: String(userId),
        customerType: 'user',
      },
    });

    if (!session.url) {
      throw new BadRequestException('Failed to create checkout session');
    }

    return { url: session.url };
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

    const lineItems: Stripe.Checkout.SessionCreateParams.LineItem[] = [];

    for (const item of payload.items) {
      if (!Number.isInteger(item.productId) || item.quantity < 1) {
        continue;
      }

      const product = await this.productsService.findOne(item.productId);
      if (!product) continue;

      const priceRon = Number(product.price);
      lineItems.push({
        price_data: {
          currency: CURRENCY,
          product_data: {
            name: product.title,
            description: (product.description || '').slice(0, 500),
            images: product.image ? [this.toAbsoluteImageUrl(product.image)] : undefined,
          },
          unit_amount: this.ronToBani(priceRon),
        },
        quantity: item.quantity,
      });
    }

    if (lineItems.length === 0) {
      throw new BadRequestException('No valid products in cart');
    }

    lineItems.push({
      price_data: {
        currency: CURRENCY,
        product_data: {
          name: 'Livrare',
          description: 'Cost livrare',
        },
        unit_amount: this.ronToBani(DELIVERY_FEE_RON),
      },
      quantity: 1,
    });

    const session = await this.getStripe().checkout.sessions.create({
      mode: 'payment',
      line_items: lineItems,
      success_url: payload.successUrl,
      cancel_url: payload.cancelUrl,
      customer_email: payload.guest.email,
      metadata: {
        customerType: 'guest',
        guestFirstName: payload.guest.firstName,
        guestLastName: payload.guest.lastName,
        guestPhone: payload.guest.phone,
        guestCounty: payload.guest.county,
        guestCity: payload.guest.city,
        guestStreet: payload.guest.street,
        guestPostalCode: payload.guest.postalCode,
      },
    });

    if (!session.url) {
      throw new BadRequestException('Failed to create checkout session');
    }

    return { url: session.url };
  }

  private toAbsoluteImageUrl(path: string): string {
    const base = this.configService.get('FRONTEND_URL') || 'http://localhost:3000';
    if (path.startsWith('http')) return path;
    return path.startsWith('/') ? `${base}${path}` : `${base}/${path}`;
  }

  async handleWebhook(rawBody: Buffer, signature: string | undefined): Promise<void> {
    const webhookSecret = this.configService.get<string>('STRIPE_WEBHOOK_SECRET');
    if (!webhookSecret) {
      throw new Error('STRIPE_WEBHOOK_SECRET is required for webhooks');
    }
    if (!signature) {
      throw new BadRequestException('Missing Stripe signature');
    }

    let event: Stripe.Event;
    try {
      event = this.getStripe().webhooks.constructEvent(
        rawBody,
        signature,
        webhookSecret,
      );
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      throw new BadRequestException(`Webhook signature verification failed: ${message}`);
    }

    if (event.type === 'checkout.session.completed') {
      const session = event.data.object as Stripe.Checkout.Session;
      const userId = session.client_reference_id || session.metadata?.userId;
      if (userId) {
        await this.cartService.clearCart(Number(userId));
      }
    }
  }
}
