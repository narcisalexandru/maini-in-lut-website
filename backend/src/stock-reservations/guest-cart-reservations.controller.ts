import { Body, Controller, Put, Req, Res } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { Request, Response } from 'express';
import { SyncGuestReservationsDto } from './dto/sync-guest-reservations.dto';
import { GuestHolderService } from './guest-holder.service';
import { StockReservationsService } from './stock-reservations.service';

@Controller('cart/guest')
export class GuestCartReservationsController {
  constructor(
    private readonly stockReservationsService: StockReservationsService,
    private readonly guestHolderService: GuestHolderService,
  ) {}

  @Throttle({ default: { limit: 30, ttl: 60_000 } })
  @Put('reservations')
  async syncGuestReservations(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
    @Body() body: SyncGuestReservationsDto,
  ) {
    const guestId = this.guestHolderService.resolve(req, res);
    return this.stockReservationsService.syncForHolder(
      { type: 'guest', guestId },
      body.items ?? [],
    );
  }
}
