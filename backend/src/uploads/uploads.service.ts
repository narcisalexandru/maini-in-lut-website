import { BadRequestException, Injectable } from '@nestjs/common';
import { mkdir, writeFile } from 'fs/promises';
import { join } from 'path';
import { randomUUID } from 'crypto';
import sharp from 'sharp';

const MAX_IMAGES = 3;
const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024;
const MAX_WIDTH = 1200;
const WEBP_QUALITY = 82;

@Injectable()
export class UploadsService {
  private readonly uploadsDir = join(process.cwd(), 'uploads', 'products');

  async saveProductImages(
    files: Express.Multer.File[],
  ): Promise<{ urls: string[] }> {
    if (!files?.length) {
      throw new BadRequestException('At least one image is required');
    }

    if (files.length > MAX_IMAGES) {
      throw new BadRequestException(`Maximum ${MAX_IMAGES} images allowed`);
    }

    await mkdir(this.uploadsDir, { recursive: true });

    const urls: string[] = [];

    for (const file of files) {
      if (!file.mimetype?.startsWith('image/')) {
        throw new BadRequestException('Only image files are allowed');
      }

      if (file.size > MAX_FILE_SIZE_BYTES) {
        throw new BadRequestException('Each image must be under 10MB');
      }

      const filename = `${randomUUID()}.webp`;
      const outputPath = join(this.uploadsDir, filename);

      const optimized = await sharp(file.buffer)
        .rotate()
        .resize({
          width: MAX_WIDTH,
          height: MAX_WIDTH,
          fit: 'inside',
          withoutEnlargement: true,
        })
        .webp({ quality: WEBP_QUALITY })
        .toBuffer();

      await writeFile(outputPath, optimized);
      urls.push(`/uploads/products/${filename}`);
    }

    return { urls };
  }
}
