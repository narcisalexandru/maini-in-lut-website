import { Type } from 'class-transformer';
import {
  IsBoolean,
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

  @IsOptional()
  @IsString()
  @MaxLength(4000)
  body?: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  imageUrl?: string;

  @IsOptional()
  @IsEnum(InboxAudience)
  audience?: InboxAudience;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  artistId?: number;

  @IsOptional()
  @IsBoolean()
  noReply?: boolean;
}
