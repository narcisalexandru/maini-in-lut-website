import {
  IsDateString,
  IsEnum,
  IsInt,
  IsOptional,
  Min,
  ValidateIf,
} from 'class-validator';
import { UpdateProductDto } from './update-product.dto';
import { ProductStatus } from '../../common/enums/product-status.enum';

export class AdminUpdateProductDto extends UpdateProductDto {
  @IsOptional()
  @IsInt()
  @Min(0)
  popularity?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  reviewsCount?: number;

  @IsOptional()
  @ValidateIf((_, value) => value !== null)
  @IsDateString()
  datePublished?: string | null;

  @IsOptional()
  @IsEnum(ProductStatus)
  status?: ProductStatus;
}
