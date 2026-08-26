import {
  Controller,
  Get,
  Patch,
  Param,
  Body,
  UseGuards,
  Request,
  ParseIntPipe,
  Query,
} from '@nestjs/common';
import { OrdersService } from './orders.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from '../common/enums/user-role.enum';
import { AuthenticatedRequest } from '../common/types/authenticated-request.interface';
import { UpdateOrderItemStatusDto } from './dto/update-order-item-status.dto';
import { ListOrdersQueryDto } from './dto/list-orders-query.dto';
import {
  toOrderDetailResponse,
  toOrderItemResponse,
  toOrderSummaryResponse,
} from './utils/order-response.util';
import { AuditLogService } from '../audit-log/audit-log.service';
import { AuditAction } from '../audit-log/enums/audit-action.enum';
import { AuditTargetType } from '../audit-log/enums/audit-target-type.enum';
import { orderItemAuditContext } from '../audit-log/utils/audit-log-context.util';

@Controller('admin/orders')
@UseGuards(JwtAuthGuard, RolesGuard)
export class AdminOrdersController {
  constructor(
    private readonly ordersService: OrdersService,
    private readonly auditLogService: AuditLogService,
  ) {}

  @Roles(UserRole.ARTIST, UserRole.SUPER_ADMIN)
  @Get('artist/mine')
  async findForArtist(
    @Request() req: AuthenticatedRequest,
    @Query() query: ListOrdersQueryDto,
  ) {
    const orders = await this.ordersService.findForArtist(req.user.id, query);
    return orders.map((order) => ({
      ...toOrderSummaryResponse(order),
      items: (order.items ?? []).map(toOrderItemResponse),
    }));
  }

  @Roles(UserRole.SUPER_ADMIN)
  @Get()
  async findAll(@Query() query: ListOrdersQueryDto) {
    const orders = await this.ordersService.findAllForAdmin(query);
    return orders.map(toOrderSummaryResponse);
  }

  @Roles(UserRole.SUPER_ADMIN, UserRole.ARTIST)
  @Patch(':id/unarchive')
  async unarchive(
    @Request() req: AuthenticatedRequest,
    @Param('id', ParseIntPipe) id: number,
  ) {
    const order = await this.ordersService.unarchiveOrder(req.user, id);
    await this.auditLogService.record(req.user, {
      action: AuditAction.ORDER_UNARCHIVED,
      targetType: AuditTargetType.ORDER,
      targetId: order.id,
      metadata: {
        publicOrderNumber: order.publicOrderNumber,
      },
    });
    return toOrderDetailResponse(order);
  }

  @Roles(UserRole.SUPER_ADMIN)
  @Get(':id')
  async findOne(@Param('id', ParseIntPipe) id: number) {
    const order = await this.ordersService.findOneForAdmin(id);
    return toOrderDetailResponse(order);
  }

  @Roles(UserRole.SUPER_ADMIN, UserRole.ARTIST)
  @Patch('items/:itemId/status')
  async updateItemStatus(
    @Request() req: AuthenticatedRequest,
    @Param('itemId', ParseIntPipe) itemId: number,
    @Body() dto: UpdateOrderItemStatusDto,
  ) {
    const item = await this.ordersService.updateItemStatus(
      req.user,
      itemId,
      dto.status,
    );
    await this.auditLogService.record(req.user, {
      action: AuditAction.ORDER_ITEM_STATUS_UPDATED,
      targetType: AuditTargetType.ORDER_ITEM,
      ...orderItemAuditContext(item),
      metadata: {
        status: dto.status,
        orderId: item.orderId,
        publicOrderNumber: item.order?.publicOrderNumber ?? null,
      },
    });
    return toOrderItemResponse(item);
  }
}
