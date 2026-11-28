import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ArtistsModule } from '../artists/artists.module';
import { CheckoutModule } from '../checkout/checkout.module';
import { InvoicesModule } from '../invoices/invoices.module';
import { EmailModule } from '../email/email.module';
import { AdminWorkshopsController } from './admin-workshops.controller';
import { WorkshopBooking } from './entities/workshop-booking.entity';
import { Workshop } from './entities/workshop.entity';
import { WorkshopsController } from './workshops.controller';
import { WorkshopsService } from './workshops.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([Workshop, WorkshopBooking]),
    ArtistsModule,
    CheckoutModule,
    EmailModule,
    InvoicesModule,
  ],
  controllers: [WorkshopsController, AdminWorkshopsController],
  providers: [WorkshopsService],
})
export class WorkshopsModule {}
