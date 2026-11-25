import {
  Controller,
  Param,
  ParseIntPipe,
  Post,
  Request,
  UseGuards,
} from '@nestjs/common';
import { AuditLogService } from '../audit-log/audit-log.service';
import { AuditAction } from '../audit-log/enums/audit-action.enum';
import { AuditTargetType } from '../audit-log/enums/audit-target-type.enum';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from '../common/enums/user-role.enum';
import { RolesGuard } from '../common/guards/roles.guard';
import { AuthenticatedRequest } from '../common/types/authenticated-request.interface';
import { InvoicesService } from './invoices.service';

@Controller('admin/orders')
@UseGuards(JwtAuthGuard, RolesGuard)
export class AdminInvoicesController {
  constructor(
    private readonly invoicesService: InvoicesService,
    private readonly auditLogService: AuditLogService,
  ) {}

  @Roles(UserRole.SUPER_ADMIN)
  @Post(':id/invoice')
  async issue(
    @Request() req: AuthenticatedRequest,
    @Param('id', ParseIntPipe) id: number,
  ) {
    const result = await this.invoicesService.issueForOrder(id);
    if (result.newlyIssued) {
      await this.auditLogService.record(req.user, {
        action: AuditAction.INVOICE_ISSUED,
        targetType: AuditTargetType.ORDER,
        targetId: id,
        metadata: {
          series: result.invoice.series,
          number: result.invoice.number,
        },
      });
    }
    return result.invoice;
  }
}
