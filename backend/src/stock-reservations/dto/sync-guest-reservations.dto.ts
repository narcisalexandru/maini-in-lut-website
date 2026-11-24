import {
  ArrayMaxSize,
  IsArray,
  IsInt,
  IsOptional,
  IsString,
  Max,
  Min,
  MinLength,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

class ReservationCartItemDto {
  @IsInt()
  @Min(1)
  productId: number;

  @IsInt()
  @Min(1)
  @Max(10)
  quantity: number;
}

export class SyncGuestReservationsDto {
  @IsOptional()
  @IsString()
  @MinLength(8)
  guestId?: string;

  @IsArray()
  @ArrayMaxSize(15)
  @ValidateNested({ each: true })
  @Type(() => ReservationCartItemDto)
  items: ReservationCartItemDto[];
}
