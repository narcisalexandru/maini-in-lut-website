import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsBoolean,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';

export class CreateProductDto {
  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  @MaxLength(200)
  title: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(10)
  @MaxLength(5000)
  description: string;

  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0.01)
  price: number;

  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(3)
  @IsString({ each: true })
  @MaxLength(500, { each: true })
  images: string[];

  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  category: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  material?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  capacity?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  dimensions?: string | null;

  @IsOptional()
  @IsBoolean()
  dishwasherSafe?: boolean;

  @IsOptional()
  @IsBoolean()
  microwaveSafe?: boolean;

  @IsOptional()
  @IsBoolean()
  inStock?: boolean;

  @IsOptional()
  @IsBoolean()
  isSet?: boolean;

  @IsOptional()
  @IsInt()
  @Min(0)
  stockQuantity?: number;

  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @Max(100)
  discount?: number;

  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  priceBeforeDiscount?: number | null;
}
