import {
  Controller,
  Post,
  UploadedFiles,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from '../common/enums/user-role.enum';
import { UploadsService } from './uploads.service';

@Controller('admin/uploads')
@UseGuards(JwtAuthGuard, RolesGuard)
export class UploadsController {
  constructor(private readonly uploadsService: UploadsService) {}

  @Roles(UserRole.ARTIST)
  @Post('product-images')
  @UseInterceptors(
    FilesInterceptor('images', 3, {
      storage: memoryStorage(),
      limits: { fileSize: 10 * 1024 * 1024 },
    }),
  )
  async uploadProductImages(
    @UploadedFiles() files: Express.Multer.File[],
  ) {
    return this.uploadsService.saveProductImages(files);
  }
}
