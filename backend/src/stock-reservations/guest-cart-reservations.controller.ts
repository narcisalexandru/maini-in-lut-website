import { Body, Controller, Put } from '@nestjs/common';
import { SyncGuestReservationsDto } from './dto/sync-guest-reservations.dto';
import { StockReservationsService } from './stock-reservations.service';

@Controller('cart/guest')
export class GuestCartReservationsController {
  constructor(
    private readonly stockReservationsService: StockReservationsService,
  ) {}

  @Put('reservations')
  async syncGuestReservations(@Body() body: SyncGuestReservationsDto) {
    return this.stockReservationsService.syncForHolder(
      { type: 'guest', guestId: body.guestId.trim() },
      body.items ?? [],
    );
  }
}
