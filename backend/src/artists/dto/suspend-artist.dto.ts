import { IsNotEmpty, IsString, MaxLength, MinLength } from 'class-validator';

export class SuspendArtistDto {
  @IsString()
  @IsNotEmpty()
  @MinLength(5)
  @MaxLength(1000)
  reason: string;
}
