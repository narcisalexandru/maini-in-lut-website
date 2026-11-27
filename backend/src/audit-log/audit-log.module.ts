import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AdminAuditLog } from './entities/admin-audit-log.entity';
import { AuditLogService } from './audit-log.service';
import { AdminAuditLogController } from './admin-audit-log.controller';
import { UsersModule } from '../users/users.module';
import { Artist } from '../artists/entities/artist.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([AdminAuditLog, Artist]),
    UsersModule,
  ],
  controllers: [AdminAuditLogController],
  providers: [AuditLogService],
  exports: [AuditLogService],
})
export class AuditLogModule {}
