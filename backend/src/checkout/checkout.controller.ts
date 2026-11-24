import {
  Controller,
  Post,
  Get,
  Param,
  Body,
  Req,
  Res,
  BadRequestException,
  UseGuards,
} from '@nestjs/common';
import { Throttle, SkipThrottle } from '@nestjs/throttler';
import { Request, Response } from 'express';
import { CheckoutService, BillingDetailsDto } from './checkout.service';
import { OptionalJwtAuthGuard } from '../auth/guards/optional-jwt-auth.guard';
import { User } from '../users/entities/user.entity';
import { GuestHolderService } from '../stock-reservations/guest-holder.service';

type CheckoutRequest = Request & { user?: User };

type CheckoutBody = {
  successUrl?: string;
  cancelUrl?: string;
  deliveryAddress?: {
    label?: string;
    county: string;
    city: string;
    street: string;
    postalCode: string;
    recipientName?: string;
    recipientPhone?: string;
    lockerId?: string;
  };
  billingDetails?: BillingDetailsDto;
  deliveryMethod?: 'EASYBOX' | 'ADDRESS';
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
    lockerId?: string;
  };
};

@Controller('checkout')
export class CheckoutController {
  constructor(
    private readonly checkoutService: CheckoutService,
    private readonly guestHolderService: GuestHolderService,
  ) {}

  @SkipThrottle()
  @Get('easybox-config')
  getEasyboxConfig() {
    return this.checkoutService.getEasyboxPluginConfig();
  }

  @Throttle({ default: { limit: 20, ttl: 60_000 } })
  @Get('company/:cui')
  async getCompanyByCui(@Param('cui') cui: string) {
    return this.checkoutService.lookupCompanyByCui(cui);
  }

  @Get('order-status/:orderId')
  async getOrderStatus(@Param('orderId') orderId: string, @Req() req: Request) {
    req.res?.setHeader('Cache-Control', 'no-store');
    return this.checkoutService.getCardOrderStatus(orderId);
  }

  @Throttle({ default: { limit: 8, ttl: 60_000 } })
  @Post('create-session')
  @UseGuards(OptionalJwtAuthGuard)
  async createSession(
    @Req() req: CheckoutRequest,
    @Res({ passthrough: true }) res: Response,
    @Body() body: CheckoutBody,
  ) {
    const successUrl = this.storefrontUrl(body.successUrl, '/plata/succes');
    const cancelUrl = this.storefrontUrl(body.cancelUrl, '/cos');

    const userId = req.user?.id;
    if (userId) {
      return this.checkoutService.createCheckoutSessionForUser(
        userId,
        successUrl,
        cancelUrl,
        body.deliveryAddress,
        body.billingDetails,
        body.deliveryMethod,
      );
    }

    if (!body.guest) {
      throw new BadRequestException('Datele pentru comanda guest lipsesc.');
    }
    const guestCartId = this.guestHolderService.resolve(req, res);

    return this.checkoutService.createCheckoutSessionForGuest({
      successUrl,
      cancelUrl,
      guestCartId,
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
        lockerId: body.guest.lockerId || '',
      },
      billingDetails: body.billingDetails,
      deliveryMethod: body.deliveryMethod,
    });
  }

  @SkipThrottle()
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
    const rawBody = (req as Request & { rawBody?: Buffer }).rawBody;
    const rawData = rawBody?.length
      ? rawBody.toString('utf8')
      : JSON.stringify(body);
    await this.checkoutService.handleIpn(verificationToken, rawData, body);
    return { errorCode: 0 };
  }

  private storefrontUrl(pathOrUrl: string | undefined, fallbackPath: string): string {
    const frontend = (process.env.FRONTEND_URL || 'http://localhost:3000').replace(/\/$/, '');
    let frontendOrigin = 'http://localhost:3000';
    try {
      frontendOrigin = new URL(frontend).origin;
    } catch {
      frontendOrigin = 'http://localhost:3000';
    }
    if (pathOrUrl?.startsWith('/') && !pathOrUrl.startsWith('//')) {
      return `${frontend}${pathOrUrl}`;
    }
    if (pathOrUrl) {
      try {
        const parsed = new URL(pathOrUrl);
        if (parsed.origin === frontendOrigin) {
          return parsed.toString();
        }
      } catch {
        return `${frontend}${fallbackPath}`;
      }
    }
    return `${frontend}${fallbackPath}`;
  }
}
