import {
  Controller,
  Post,
  Body,
  Req,
  RawBodyRequest,
  BadRequestException,
} from '@nestjs/common';
import { Request } from 'express';
import { CheckoutService } from './checkout.service';

@Controller('checkout')
export class CheckoutController {
  constructor(private readonly checkoutService: CheckoutService) {}

  @Post('create-session')
  async createSession(
    @Req() req: Request,
    @Body()
    body: {
      successUrl?: string;
      cancelUrl?: string;
      items?: { productId: number; quantity: number }[];
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
    },
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
      return this.checkoutService.createCheckoutSessionForUser(
        payload.sub,
        successUrl,
        cancelUrl,
      );
    }

    if (!body.guest) {
      throw new BadRequestException('Datele pentru comanda guest lipsesc.');
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
    });
  }

  @Post('webhook')
  async webhook(@Req() req: RawBodyRequest<Request>) {
    const rawBody = req.rawBody;
    if (!rawBody) {
      throw new Error(
        'Raw body is required for webhook. Enable rawBody in main.ts.',
      );
    }
    const signature = req.headers['stripe-signature'] as string | undefined;
    await this.checkoutService.handleWebhook(rawBody, signature);
    return { received: true };
  }
}
