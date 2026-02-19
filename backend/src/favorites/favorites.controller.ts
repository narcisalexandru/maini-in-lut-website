import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Body,
  UseGuards,
  Request,
  ParseIntPipe,
} from '@nestjs/common';
import { FavoritesService } from './favorites.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('users/favorites')
@UseGuards(JwtAuthGuard)
export class FavoritesController {
  constructor(private readonly favoritesService: FavoritesService) {}

  @Get()
  async getFavorites(@Request() req) {
    return this.favoritesService.findAll(req.user.id);
  }

  @Post('merge')
  async mergeFavorites(
    @Request() req,
    @Body() body: { productIds?: number[] },
  ) {
    const productIds = body?.productIds ?? [];
    if (!Array.isArray(productIds) || productIds.length === 0) {
      return this.favoritesService.findAll(req.user.id);
    }
    await this.favoritesService.addMany(req.user.id, productIds);
    return this.favoritesService.findAll(req.user.id);
  }

  @Post(':productId')
  async addFavorite(
    @Request() req,
    @Param('productId', ParseIntPipe) productId: number,
  ) {
    return this.favoritesService.add(req.user.id, productId);
  }

  @Delete(':productId')
  async removeFavorite(
    @Request() req,
    @Param('productId', ParseIntPipe) productId: number,
  ) {
    return this.favoritesService.remove(req.user.id, productId);
  }
}
