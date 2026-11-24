import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { mkdir, writeFile } from 'fs/promises';
import { join } from 'path';
import { randomUUID } from 'crypto';
import sharp from 'sharp';
import { Repository } from 'typeorm';
import { Artist } from '../artists/entities/artist.entity';
import { Product } from '../products/entities/product.entity';

const MAX_IMAGES = 3;
const MAX_IMAGES_PER_ARTIST = 200;
const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024;
const MAX_WIDTH = 1200;
const MAX_SOURCE_DIMENSION = 8000;
const MAX_INPUT_PIXELS = 16_000_000;
const WEBP_QUALITY = 82;

function hasAllowedMagicBytes(buffer: Buffer): boolean {
  if (buffer.length < 12) {
    return false;
  }
  const isJpeg = buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff;
  const isPng = buffer.subarray(0, 4).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47]));
  const isWebp =
    buffer.subarray(0, 4).toString('ascii') === 'RIFF' &&
    buffer.subarray(8, 12).toString('ascii') === 'WEBP';
  return isJpeg || isPng || isWebp;
}

@Injectable()
export class UploadsService {
  private readonly uploadsDir = join(process.cwd(), 'uploads', 'products');

  constructor(
    @InjectRepository(Artist)
    private readonly artistsRepository: Repository<Artist>,
    @InjectRepository(Product)
    private readonly productsRepository: Repository<Product>,
  ) {}

  async saveProductImages(
    userId: number,
    files: Express.Multer.File[],
  ): Promise<{ urls: string[] }> {
    if (!files?.length) {
      throw new BadRequestException('At least one image is required');
    }

    if (files.length > MAX_IMAGES) {
      throw new BadRequestException(`Maximum ${MAX_IMAGES} images allowed`);
    }

    const artist = await this.artistsRepository.findOne({ where: { userId } });
    if (!artist) {
      throw new BadRequestException('Approved artist profile required');
    }
    const existing = await this.productsRepository.find({
      where: { artistId: artist.id },
      select: ['id', 'images'],
    });
    const storedCount = existing.reduce(
      (count, product) => count + (product.images?.length ?? 0),
      0,
    );
    if (storedCount + files.length > MAX_IMAGES_PER_ARTIST) {
      throw new BadRequestException('Image quota exceeded');
    }

    await mkdir(this.uploadsDir, { recursive: true });

    const urls: string[] = [];

    for (const file of files) {
      const mime = file.mimetype;
      if (mime !== 'image/jpeg' && mime !== 'image/png' && mime !== 'image/webp') {
        throw new BadRequestException('Only JPEG, PNG, and WebP images are allowed');
      }
      if (!hasAllowedMagicBytes(file.buffer)) {
        throw new BadRequestException('Only JPEG, PNG, and WebP images are allowed');
      }
      if (file.size > MAX_FILE_SIZE_BYTES) {
        throw new BadRequestException('Each image must be under 10MB');
      }

      const image = sharp(file.buffer, {
        limitInputPixels: MAX_INPUT_PIXELS,
        failOn: 'error',
        animated: false,
        pages: 1,
      });
      const metadata = await image.metadata();
      if (
        !metadata.format ||
        !['jpeg', 'png', 'webp'].includes(metadata.format) ||
        (metadata.width ?? 0) > MAX_SOURCE_DIMENSION ||
        (metadata.height ?? 0) > MAX_SOURCE_DIMENSION
      ) {
        throw new BadRequestException('Only JPEG, PNG, and WebP images are allowed');
      }

      const filename = `${randomUUID()}.webp`;
      const outputPath = join(this.uploadsDir, filename);
      const optimized = await image
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
