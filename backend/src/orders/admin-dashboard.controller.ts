import { Controller, Get, Query, Request, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from '../common/enums/user-role.enum';
import { RolesGuard } from '../common/guards/roles.guard';
import { AuthenticatedRequest } from '../common/types/authenticated-request.interface';
import { DashboardSalesQueryDto } from './dto/dashboard-sales-query.dto';
import { OrdersService } from './orders.service';

@Controller('admin/dashboard')
@UseGuards(JwtAuthGuard, RolesGuard)
export class AdminDashboardController {
  constructor(private readonly ordersService: OrdersService) {}

  @Roles(UserRole.ARTIST, UserRole.SUPER_ADMIN)
  @Get('sales')
  sales(
    @Request() req: AuthenticatedRequest,
    @Query() query: DashboardSalesQueryDto,
  ) {
    return this.ordersService.getArtistSalesDashboard(req.user, query.artistId);
  }
}
