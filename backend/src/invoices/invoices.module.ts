import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuditLogModule } from '../audit-log/audit-log.module';
import { EmailModule } from '../email/email.module';
import { Order } from '../orders/entities/order.entity';
import { AdminInvoicesController } from './admin-invoices.controller';
import { InvoicesService } from './invoices.service';
import { SmartbillClient } from './smartbill.client';

@Module({
  imports: [TypeOrmModule.forFeature([Order]), EmailModule, AuditLogModule],
  controllers: [AdminInvoicesController],
  providers: [InvoicesService, SmartbillClient],
  exports: [InvoicesService],
})
export class InvoicesModule {}
