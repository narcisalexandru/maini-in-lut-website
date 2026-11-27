import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsInt,
  IsISO8601,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
  MinLength,
  ValidateIf,
} from 'class-validator';

export class SaveWorkshopDto {
  @IsString()
  @MinLength(3)
  @MaxLength(160)
  title: string;

  @IsString()
  @MinLength(10)
  @MaxLength(5000)
  description: string;

  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @Max(100000)
  fee: number;

  @IsBoolean()
  allowCard: boolean;

  @IsBoolean()
  allowCash: boolean;

  @IsISO8601()
  startsAt: string;

  @IsOptional()
  @ValidateIf((_, value) => value !== null && value !== '')
  @IsISO8601()
  endsAt?: string | null;

  @IsString()
  @MinLength(2)
  @MaxLength(200)
  location: string;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(500)
  capacity: number;

  @IsBoolean()
  published: boolean;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  artistId?: number;
}
