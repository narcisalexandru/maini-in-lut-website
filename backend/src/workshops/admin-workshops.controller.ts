import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Put,
  Request,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { RolesGuard } from '../common/guards/roles.guard';
import { UserRole } from '../common/enums/user-role.enum';
import { AuthenticatedRequest } from '../common/types/authenticated-request.interface';
import { ReserveWorkshopSeatsDto } from './dto/reserve-workshop-seats.dto';
import { UpdateWorkshopReservationDto } from './dto/update-workshop-reservation.dto';
import { SaveWorkshopDto } from './dto/save-workshop.dto';
import { WorkshopsService } from './workshops.service';

@Controller('admin/workshops')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.SUPER_ADMIN, UserRole.ARTIST)
export class AdminWorkshopsController {
  constructor(private readonly workshopsService: WorkshopsService) {}

  @Get()
  list(@Request() req: AuthenticatedRequest) {
    return this.workshopsService.listForAdmin(req.user);
  }

  @Get(':id')
  getOne(
    @Request() req: AuthenticatedRequest,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.workshopsService.getForAdmin(req.user, id);
  }

  @Post()
  create(@Request() req: AuthenticatedRequest, @Body() dto: SaveWorkshopDto) {
    return this.workshopsService.create(req.user, dto);
  }

  @Post(':id/reservations')
  reserve(
    @Request() req: AuthenticatedRequest,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: ReserveWorkshopSeatsDto,
  ) {
    return this.workshopsService.reserveSeats(req.user, id, dto.spots);
  }

  @Put(':id/reservations/:bookingId')
  updateReservation(
    @Request() req: AuthenticatedRequest,
    @Param('id', ParseIntPipe) id: number,
    @Param('bookingId', ParseIntPipe) bookingId: number,
    @Body() dto: UpdateWorkshopReservationDto,
  ) {
    return this.workshopsService.updateReservation(req.user, id, bookingId, dto.spots);
  }

  @Put(':id')
  update(
    @Request() req: AuthenticatedRequest,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: SaveWorkshopDto,
  ) {
    return this.workshopsService.update(req.user, id, dto);
  }

  @Delete(':id')
  remove(
    @Request() req: AuthenticatedRequest,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.workshopsService.remove(req.user, id);
  }
}
