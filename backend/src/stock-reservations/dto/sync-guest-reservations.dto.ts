import {
  IsArray,
  IsInt,
  IsString,
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
  quantity: number;
}

export class SyncGuestReservationsDto {
  @IsString()
  @MinLength(8)
  guestId: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ReservationCartItemDto)
  items: ReservationCartItemDto[];
}
