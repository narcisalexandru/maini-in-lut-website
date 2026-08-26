import {
  Controller,
  Post,
  Get,
  Param,
  Body,
  Req,
  BadRequestException,
} from '@nestjs/common';
import { Request } from 'express';
import { CheckoutService, BillingDetailsDto } from './checkout.service';

type CheckoutBody = {
  successUrl?: string;
  cancelUrl?: string;
  paymentMethod?: 'card' | 'cash';
  deliveryAddress?: {
    label?: string;
    county: string;
    city: string;
    street: string;
    postalCode: string;
    recipientName?: string;
    recipientPhone?: string;
  };
  billingDetails?: BillingDetailsDto;
  items?: { productId: number; quantity: number }[];
  guestCartId?: string;
  guest?: {
    firstName?: string;
    lastName?: string;
    email?: string;
    phone?: string;
    county?: string;
    city?: string;
    street?: string;
    postalCode?: string;
  };
};

type CashOrderBody = {
  deliveryAddress?: CheckoutBody['deliveryAddress'];
  billingDetails?: BillingDetailsDto;
  items?: { productId: number; quantity: number }[];
  guestCartId?: string;
  guest?: CheckoutBody['guest'];
};

@Controller('checkout')
export class CheckoutController {
  constructor(private readonly checkoutService: CheckoutService) {}

  @Get('company/:cui')
  async getCompanyByCui(@Param('cui') cui: string) {
    return this.checkoutService.lookupCompanyByCui(cui);
  }

  @Post('create-session')
  async createSession(
    @Req() req: Request,
    @Body() body: CheckoutBody,
  ) {
    const frontendUrl =
      process.env.FRONTEND_URL || 'http://localhost:3000';
    const successUrl =
      body.successUrl?.startsWith('http') || body.successUrl?.startsWith('/')
        ? body.successUrl.startsWith('http')
          ? body.successUrl
          : `${frontendUrl}${body.successUrl}`
        : `${frontendUrl}/plata/succes`;
    const cancelUrl =
      body.cancelUrl?.startsWith('http') || body.cancelUrl?.startsWith('/')
        ? body.cancelUrl.startsWith('http')
          ? body.cancelUrl
          : `${frontendUrl}${body.cancelUrl}`
        : `${frontendUrl}/cos`;

    const authHeader = req.headers.authorization;
    const token =
      typeof authHeader === 'string' && authHeader.startsWith('Bearer ')
        ? authHeader.slice(7).trim()
        : null;

    if (token) {
      let payload: { sub?: number } | null = null;
      try {
        const tokenPayload = token.split('.')[1];
        payload = JSON.parse(
          Buffer.from(tokenPayload, 'base64url').toString(),
        ) as { sub?: number };
      } catch {
        throw new BadRequestException('Token invalid');
      }

      if (!payload?.sub) {
        throw new BadRequestException('Token invalid');
      }
      if (body.paymentMethod === 'cash') {
        return this.checkoutService.createCashOrderForUser(
          payload.sub,
          body.deliveryAddress,
          body.billingDetails,
        );
      }
      return this.checkoutService.createCheckoutSessionForUser(
        payload.sub,
        successUrl,
        cancelUrl,
        body.deliveryAddress,
        body.billingDetails,
      );
    }

    if (!body.guest) {
      throw new BadRequestException('Datele pentru comanda guest lipsesc.');
    }
    if (body.paymentMethod === 'cash') {
      return this.checkoutService.createCashOrderForGuest({
        items: body.items || [],
        guest: {
          firstName: body.guest.firstName || '',
          lastName: body.guest.lastName || '',
          email: body.guest.email || '',
          phone: body.guest.phone || '',
          county: body.guest.county || '',
          city: body.guest.city || '',
          street: body.guest.street || '',
          postalCode: body.guest.postalCode || '',
        },
        billingDetails: body.billingDetails,
      });
    }

    return this.checkoutService.createCheckoutSessionForGuest({
      successUrl,
      cancelUrl,
      items: body.items || [],
      guest: {
        firstName: body.guest.firstName || '',
        lastName: body.guest.lastName || '',
        email: body.guest.email || '',
        phone: body.guest.phone || '',
        county: body.guest.county || '',
        city: body.guest.city || '',
        street: body.guest.street || '',
        postalCode: body.guest.postalCode || '',
      },
      billingDetails: body.billingDetails,
    });
  }

  @Post('cash-order')
  async createCashOrder(
    @Req() req: Request,
    @Body() body: CashOrderBody,
  ) {
    const authHeader = req.headers.authorization;
    const token =
      typeof authHeader === 'string' && authHeader.startsWith('Bearer ')
        ? authHeader.slice(7).trim()
        : null;

    if (token) {
      let payload: { sub?: number } | null = null;
      try {
        const tokenPayload = token.split('.')[1];
        payload = JSON.parse(
          Buffer.from(tokenPayload, 'base64url').toString(),
        ) as { sub?: number };
      } catch {
        throw new BadRequestException('Token invalid');
      }
      if (!payload?.sub) {
        throw new BadRequestException('Token invalid');
      }
      return this.checkoutService.createCashOrderForUser(
        payload.sub,
        body.deliveryAddress,
        body.billingDetails,
      );
    }

    if (!body.guest) {
      throw new BadRequestException('Datele pentru comanda guest lipsesc.');
    }
    return this.checkoutService.createCashOrderForGuest({
      items: body.items || [],
      guest: {
        firstName: body.guest.firstName || '',
        lastName: body.guest.lastName || '',
        email: body.guest.email || '',
        phone: body.guest.phone || '',
        county: body.guest.county || '',
        city: body.guest.city || '',
        street: body.guest.street || '',
        postalCode: body.guest.postalCode || '',
      },
      billingDetails: body.billingDetails,
    });
  }

  @Post('ipn')
  async ipn(
    @Req() req: Request,
    @Body() body: Record<string, unknown>,
  ) {
    const verificationToken = req.headers['verification-token'] as
      | string
      | undefined;
    if (!verificationToken) {
      throw new BadRequestException('Lipseste header-ul verification-token.');
    }
    await this.checkoutService.handleIpn(verificationToken, body);
    return { errorCode: 0 };
  }
}
