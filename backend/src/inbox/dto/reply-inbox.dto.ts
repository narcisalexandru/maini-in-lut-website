import { IsOptional, IsString, MaxLength } from 'class-validator';

export class ReplyInboxDto {
  @IsOptional()
  @IsString()
  @MaxLength(4000)
  body?: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  imageUrl?: string;
}
