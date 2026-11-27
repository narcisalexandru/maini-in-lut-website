import {
  Controller,
  Get,
  NotFoundException,
  Param,
  ParseIntPipe,
  Req,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Request } from 'express';
import { ProductsService } from './products.service';
import { toPublicProductResponse } from './utils/product-response.util';
import { StockReservationsService } from '../stock-reservations/stock-reservations.service';
import { GuestHolderService } from '../stock-reservations/guest-holder.service';
import { CartHolder } from '../stock-reservations/types/cart-holder.type';
import { ACCESS_TOKEN_COOKIE } from '../auth/auth-cookie.util';
import { JwtPayload } from '../common/types/jwt-payload.interface';

@Controller('products')
export class ProductsController {
  constructor(
    private readonly productsService: ProductsService,
    private readonly stockReservationsService: StockReservationsService,
    private readonly guestHolderService: GuestHolderService,
    private readonly jwtService: JwtService,
  ) {}

  @Get()
  async findAll(@Req() req: Request) {
    const products = await this.productsService.findAllPublic();
    const holder = this.resolveHolder(req);
    const availableMap = await this.stockReservationsService.getAvailableStockMap(
      products,
      holder,
    );
    return products.map((product) =>
      toPublicProductResponse(product, availableMap.get(product.id)),
    );
  }

  @Get(':id')
  async findOne(@Req() req: Request, @Param('id', ParseIntPipe) id: number) {
    const product = await this.productsService.findOnePublic(id);
    if (!product) {
      throw new NotFoundException(`Product with ID ${id} not found`);
    }
    const holder = this.resolveHolder(req);
    const available = await this.stockReservationsService.getAvailableForHolder(
      product,
      holder,
    );
    return toPublicProductResponse(product, available);
  }

  private resolveHolder(req: Request): CartHolder | undefined {
    const bearer = req.headers.authorization;
    const token =
      (typeof bearer === 'string' && bearer.startsWith('Bearer ')
        ? bearer.slice(7).trim()
        : '') || req.cookies?.[ACCESS_TOKEN_COOKIE];
    if (typeof token === 'string' && token) {
      try {
        const payload = this.jwtService.verify<JwtPayload>(token);
        if (payload?.sub) {
          return { type: 'user', userId: payload.sub };
        }
      } catch {
        // A stale browser cookie must not hide the public catalog.
      }
    }

    const guestId = this.guestHolderService.readIfPresent(req);
    if (guestId) {
      return { type: 'guest', guestId };
    }
    return undefined;
  }
}
