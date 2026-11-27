import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { SkipThrottle, Throttle } from '@nestjs/throttler';
import { Request } from 'express';
import { BadRequestException } from '@nestjs/common';
import { OptionalJwtAuthGuard } from '../auth/guards/optional-jwt-auth.guard';
import { User } from '../users/entities/user.entity';
import { CreateWorkshopBookingDto } from './dto/create-workshop-booking.dto';
import { WorkshopsService } from './workshops.service';

type BookingRequest = Request & { user?: User };

@Controller('workshops')
export class WorkshopsController {
  constructor(private readonly workshopsService: WorkshopsService) {}

  @Get()
  list() {
    return this.workshopsService.listPublic();
  }

  @Get('bookings/:code')
  status(@Param('code') code: string) {
    return this.workshopsService.getBookingStatus(code);
  }

  @SkipThrottle()
  @Post('ipn')
  async ipn(@Req() req: Request, @Body() body: Record<string, unknown>) {
    const verificationToken = req.headers['verification-token'];
    if (typeof verificationToken !== 'string' || !verificationToken) {
      throw new BadRequestException('Lipsește header-ul verification-token.');
    }
    const rawBody = (req as Request & { rawBody?: Buffer }).rawBody;
    const rawData = rawBody?.length ? rawBody.toString('utf8') : JSON.stringify(body);
    await this.workshopsService.handleCardIpn(verificationToken, rawData, body);
    return { errorCode: 0 };
  }

  @Get(':slug')
  getOne(@Param('slug') slug: string) {
    return this.workshopsService.getPublic(slug);
  }

  @Throttle({ default: { limit: 8, ttl: 60_000 } })
  @Post(':slug/bookings')
  @UseGuards(OptionalJwtAuthGuard)
  book(
    @Param('slug') slug: string,
    @Body() dto: CreateWorkshopBookingDto,
    @Req() req: BookingRequest,
  ) {
    return this.workshopsService.book(slug, dto, req.user?.id);
  }
}
