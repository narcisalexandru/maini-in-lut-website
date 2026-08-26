import {
  Controller,
  Get,
  Put,
  Post,
  Body,
  UseGuards,
  Request,
  NotFoundException,
  Delete,
  Param,
  ParseIntPipe,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from '../common/enums/user-role.enum';
import { AuthenticatedRequest } from '../common/types/authenticated-request.interface';
import { stripPassword } from '../common/utils/user-response.util';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { UpdateAddressDto } from './dto/update-address.dto';
import { UpdatePhoneDto } from './dto/update-phone.dto';
import { SecondaryAddressDto } from './dto/secondary-address.dto';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SUPER_ADMIN)
  @Get()
  findAll() {
    return this.usersService.findAllSanitized();
  }

  @UseGuards(JwtAuthGuard)
  @Get('profile')
  async getProfile(@Request() req: AuthenticatedRequest) {
    const user = await this.usersService.findOne(req.user.id);
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return stripPassword(user);
  }

  @UseGuards(JwtAuthGuard)
  @Put('profile')
  async updateProfile(
    @Request() req: AuthenticatedRequest,
    @Body() updateProfileDto: UpdateProfileDto,
  ) {
    const user = await this.usersService.update(req.user.id, updateProfileDto);
    return stripPassword(user);
  }

  @UseGuards(JwtAuthGuard)
  @Put('profile/address')
  async updateAddress(
    @Request() req,
    @Body() updateData: UpdateAddressDto,
  ) {
    return this.usersService.updateAddress(req.user.id, updateData);
  }

  @UseGuards(JwtAuthGuard)
  @Get('profile/address-status')
  async getAddressModificationStatus(@Request() req) {
    return this.usersService.getAddressModificationStatus(req.user.id);
  }

  @UseGuards(JwtAuthGuard)
  @Put('profile/phone')
  async updatePhone(@Request() req, @Body() updateData: UpdatePhoneDto) {
    return this.usersService.updatePhone(req.user.id, updateData.phone);
  }

  @UseGuards(JwtAuthGuard)
  @Get('profile/checkout-addresses')
  async getCheckoutAddresses(@Request() req) {
    return this.usersService.getCheckoutAddresses(req.user.id);
  }

  @UseGuards(JwtAuthGuard)
  @Post('profile/secondary-address')
  async addSecondaryAddress(
    @Request() req,
    @Body() body: SecondaryAddressDto,
  ) {
    return this.usersService.addSecondaryAddress(req.user.id, body);
  }

  @UseGuards(JwtAuthGuard)
  @Put('profile/secondary-address/:index')
  async updateSecondaryAddress(
    @Request() req,
    @Param('index') index: string,
    @Body() body: SecondaryAddressDto,
  ) {
    const parsed = Number(index);
    if (!Number.isInteger(parsed)) {
      throw new NotFoundException('Invalid secondary address index');
    }
    return this.usersService.updateSecondaryAddress(req.user.id, parsed, body);
  }

  @UseGuards(JwtAuthGuard)
  @Delete('profile/secondary-address/:index')
  async deleteSecondaryAddress(
    @Request() req,
    @Param('index') index: string,
  ) {
    const parsed = Number(index);
    if (!Number.isInteger(parsed)) {
      throw new NotFoundException('Invalid secondary address index');
    }
    return this.usersService.deleteSecondaryAddress(req.user.id, parsed);
  }

  @UseGuards(JwtAuthGuard)
  @Delete('profile')
  async deleteAccount(@Request() req) {
    return this.usersService.deleteAccount(req.user.id);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SUPER_ADMIN)
  @Get('details/:id')
  async findOne(@Param('id', ParseIntPipe) id: number) {
    const user = await this.usersService.findOne(id);
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return stripPassword(user);
  }
}
