import { Type } from 'class-transformer';
import {
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';

export enum InboxAudience {
  ALL = 'all',
  DIRECT = 'direct',
}

export class CreateInboxThreadDto {
  @IsString()
  @MinLength(3)
  @MaxLength(160)
  subject: string;

  @IsString()
  @MinLength(1)
  @MaxLength(4000)
  body: string;

  @IsOptional()
  @IsEnum(InboxAudience)
  audience?: InboxAudience;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  artistId?: number;
}
