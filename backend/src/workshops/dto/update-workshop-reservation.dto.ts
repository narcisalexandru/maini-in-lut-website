import { Type } from 'class-transformer';
import { IsInt, Max, Min } from 'class-validator';

export class UpdateWorkshopReservationDto {
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(500)
  spots: number;
}
