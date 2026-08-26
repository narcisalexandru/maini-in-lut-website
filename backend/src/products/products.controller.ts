import {
  Controller,
  Get,
  Headers,
  NotFoundException,
  Param,
  ParseIntPipe,
  Req,
} from '@nestjs/common';
import { Request } from 'express';
import { ProductsService } from './products.service';
import { toPublicProductResponse } from './utils/product-response.util';
import { StockReservationsService } from '../stock-reservations/stock-reservations.service';
import { CartHolder } from '../stock-reservations/types/cart-holder.type';

function resolveHolder(
  req: Request,
  guestCartId?: string,
): CartHolder | undefined {
  const authHeader = req.headers.authorization;
  if (typeof authHeader === 'string' && authHeader.startsWith('Bearer ')) {
    try {
      const tokenPayload = authHeader.slice(7).trim().split('.')[1];
      const payload = JSON.parse(
        Buffer.from(tokenPayload, 'base64url').toString(),
      ) as { sub?: number };
      if (payload?.sub) {
        return { type: 'user', userId: payload.sub };
      }
    } catch {
      // ignore invalid token for optional holder resolution
    }
  }

  if (guestCartId?.trim()) {
    return { type: 'guest', guestId: guestCartId.trim() };
  }

  return undefined;
}

@Controller('products')
export class ProductsController {
  constructor(
    private readonly productsService: ProductsService,
    private readonly stockReservationsService: StockReservationsService,
  ) {}

  @Get()
  async findAll(
    @Req() req: Request,
    @Headers('x-guest-cart-id') guestCartId?: string,
  ) {
    const products = await this.productsService.findAllPublic();
    const holder = resolveHolder(req, guestCartId);
    const availableMap = await this.stockReservationsService.getAvailableStockMap(
      products,
      holder,
    );
    return products.map((product) =>
      toPublicProductResponse(product, availableMap.get(product.id)),
    );
  }

  @Get(':id')
  async findOne(
    @Req() req: Request,
    @Param('id', ParseIntPipe) id: number,
    @Headers('x-guest-cart-id') guestCartId?: string,
  ) {
    const product = await this.productsService.findOnePublic(id);
    if (!product) {
      throw new NotFoundException(`Product with ID ${id} not found`);
    }
    const holder = resolveHolder(req, guestCartId);
    const available = await this.stockReservationsService.getAvailableForHolder(
      product,
      holder,
    );
    return toPublicProductResponse(product, available);
  }
}
