import { IsInt, Min } from 'class-validator';

export class RestoreTableRevisionDto {
  @IsInt()
  @Min(0)
  sequence: number;
}
