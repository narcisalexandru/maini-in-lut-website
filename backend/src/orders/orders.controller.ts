import {
  Controller,
  Get,
  Param,
  UseGuards,
  Request,
  ParseIntPipe,
} from '@nestjs/common';
import { OrdersService } from './orders.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AuthenticatedRequest } from '../common/types/authenticated-request.interface';
import {
  toOrderDetailResponse,
  toOrderSummaryResponse,
} from './utils/order-response.util';

@Controller('users/orders')
@UseGuards(JwtAuthGuard)
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Get()
  async findMine(@Request() req: AuthenticatedRequest) {
    const orders = await this.ordersService.findForUser(req.user.id);
    return orders.map(toOrderSummaryResponse);
  }

  @Get(':id')
  async findOne(
    @Request() req: AuthenticatedRequest,
    @Param('id', ParseIntPipe) id: number,
  ) {
    const order = await this.ordersService.findOneForUser(req.user.id, id);
    return toOrderDetailResponse(order);
  }
}
