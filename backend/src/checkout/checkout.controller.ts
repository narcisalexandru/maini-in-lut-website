import {
  Controller,
  Post,
  Get,
  Param,
  Body,
  Req,
  BadRequestException,
  UseGuards,
} from '@nestjs/common';
import { Request } from 'express';
import { CheckoutService, BillingDetailsDto } from './checkout.service';
import { OptionalJwtAuthGuard } from '../auth/guards/optional-jwt-auth.guard';
import { User } from '../users/entities/user.entity';

type CheckoutRequest = Request & { user?: User };

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
  @UseGuards(OptionalJwtAuthGuard)
  async createSession(
    @Req() req: CheckoutRequest,
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

    const userId = req.user?.id;
    if (userId) {
      if (body.paymentMethod === 'cash') {
        return this.checkoutService.createCashOrderForUser(
          userId,
          body.deliveryAddress,
          body.billingDetails,
        );
      }
      return this.checkoutService.createCheckoutSessionForUser(
        userId,
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
        guestCartId: body.guestCartId,
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
      guestCartId: body.guestCartId,
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
  @UseGuards(OptionalJwtAuthGuard)
  async createCashOrder(
    @Req() req: CheckoutRequest,
    @Body() body: CashOrderBody,
  ) {
    const userId = req.user?.id;
    if (userId) {
      return this.checkoutService.createCashOrderForUser(
        userId,
        body.deliveryAddress,
        body.billingDetails,
      );
    }

    if (!body.guest) {
      throw new BadRequestException('Datele pentru comanda guest lipsesc.');
    }
    return this.checkoutService.createCashOrderForGuest({
      guestCartId: body.guestCartId,
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
