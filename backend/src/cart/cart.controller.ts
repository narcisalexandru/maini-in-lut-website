import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  UseGuards,
  Request,
  ParseIntPipe,
} from '@nestjs/common';
import { CartService, CartItemDto } from './cart.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('users/cart')
@UseGuards(JwtAuthGuard)
export class CartController {
  constructor(private readonly cartService: CartService) {}

  @Get()
  async getCart(@Request() req) {
    return this.cartService.findAll(req.user.id);
  }

  @Post('merge')
  async mergeCart(
    @Request() req,
    @Body() body: { items?: CartItemDto[] },
  ) {
    const items = body?.items ?? [];
    return this.cartService.merge(req.user.id, items);
  }

  @Post('items')
  async addItem(
    @Request() req,
    @Body() body: { productId: number; quantity?: number },
  ) {
    const productId = body?.productId;
    const quantity = body?.quantity ?? 1;
    if (productId == null) {
      return this.cartService.findAll(req.user.id);
    }
    await this.cartService.add(req.user.id, productId, quantity);
    return this.cartService.findAll(req.user.id);
  }

  @Put('items/:productId')
  async setItemQuantity(
    @Request() req,
    @Param('productId', ParseIntPipe) productId: number,
    @Body() body: { quantity: number },
  ) {
    const quantity = body?.quantity ?? 1;
    await this.cartService.setQuantity(req.user.id, productId, quantity);
    return this.cartService.findAll(req.user.id);
  }

  @Delete('items/:productId')
  async removeItem(
    @Request() req,
    @Param('productId', ParseIntPipe) productId: number,
  ) {
    await this.cartService.remove(req.user.id, productId);
    return this.cartService.findAll(req.user.id);
  }
}
