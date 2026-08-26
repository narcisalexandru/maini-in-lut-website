import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  UseGuards,
  Request,
  NotFoundException,
  Param,
} from '@nestjs/common';
import { ArtistsService } from './artists.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ApplyArtistDto } from './dto/apply-artist.dto';
import { AuthenticatedRequest } from '../common/types/authenticated-request.interface';
import {
  toArtistResponse,
  toPublicArtistResponse,
} from './utils/artist-response.util';

@Controller('artists')
export class ArtistsController {
  constructor(private readonly artistsService: ArtistsService) {}

  @UseGuards(JwtAuthGuard)
  @Get('me/application')
  async getMyApplication(@Request() req: AuthenticatedRequest) {
    const artist = await this.artistsService.findByUserId(req.user.id);
    if (!artist) {
      return null;
    }
    return toArtistResponse(artist);
  }

  @UseGuards(JwtAuthGuard)
  @Post('apply')
  async apply(
    @Request() req: AuthenticatedRequest,
    @Body() dto: ApplyArtistDto,
  ) {
    const artist = await this.artistsService.apply(req.user.id, dto);
    return toArtistResponse(artist);
  }

  @UseGuards(JwtAuthGuard)
  @Patch('me/suspension-notice/dismiss')
  async dismissSuspensionNotice(@Request() req: AuthenticatedRequest) {
    const artist = await this.artistsService.dismissSuspensionNotice(
      req.user.id,
    );
    return toArtistResponse(artist);
  }

  @UseGuards(JwtAuthGuard)
  @Patch('me/reactivation-notice/dismiss')
  async dismissReactivationNotice(@Request() req: AuthenticatedRequest) {
    const artist = await this.artistsService.dismissReactivationNotice(
      req.user.id,
    );
    return toArtistResponse(artist);
  }

  @Get(':slug')
  async getPublicProfile(@Param('slug') slug: string) {
    const artist = await this.artistsService.findApprovedBySlug(slug);
    if (!artist) {
      throw new NotFoundException('Artist not found');
    }
    return toPublicArtistResponse(artist);
  }
}
