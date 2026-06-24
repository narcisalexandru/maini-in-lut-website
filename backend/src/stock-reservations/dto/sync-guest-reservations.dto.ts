import { IsArray, IsString, MinLength, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

class ReservationCartItemDto {
  productId: number;
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
