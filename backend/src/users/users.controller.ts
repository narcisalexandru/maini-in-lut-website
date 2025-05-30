import {
  Controller,
  Get,
  Put,
  Body,
  UseGuards,
  Request,
  NotFoundException,
  Delete,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

class UpdateProfileDto {
  first_name?: string;
  last_name?: string;
  county?: string;
  city?: string;
  street?: string;
  postal_code?: string;
  phone?: string;
  picture?: string;
}

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  findAll() {
    return { message: 'Lista utilizatorilor' };
  }

  @UseGuards(JwtAuthGuard)
  @Get('profile')
  async getProfile(@Request() req) {
    const user = await this.usersService.findOne(req.user.id);
    if (!user) {
      throw new NotFoundException('User not found');
    }
    const { password, ...result } = user;
    return result;
  }

  @UseGuards(JwtAuthGuard)
  @Put('profile')
  async updateProfile(
    @Request() req,
    @Body() updateProfileDto: UpdateProfileDto,
  ) {
    const user = await this.usersService.update(req.user.id, updateProfileDto);
    const { password, ...result } = user;
    return result;
  }

  @UseGuards(JwtAuthGuard)
  @Put('profile/address')
  async updateAddress(
    @Request() req,
    @Body()
    updateData: {
      county?: string;
      city?: string;
      street?: string;
      postal_code?: string;
    },
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
  async updatePhone(@Request() req, @Body() updateData: { phone: string }) {
    return this.usersService.updatePhone(req.user.id, updateData.phone);
  }

  @UseGuards(JwtAuthGuard)
  @Delete('profile')
  async deleteAccount(@Request() req) {
    return this.usersService.deleteAccount(req.user.id);
  }
}
