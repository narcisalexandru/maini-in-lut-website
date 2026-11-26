import { Transform } from 'class-transformer';
import { IsEmail, IsIn, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

export const CONTACT_SUBJECTS = {
  order: 'Comandă',
  product: 'Produs',
  collaboration: 'Colaborare',
  other: 'Altceva',
} as const;

export type ContactSubject = keyof typeof CONTACT_SUBJECTS;

function trimString(value: unknown): unknown {
  return typeof value === 'string' ? value.trim() : value;
}

function emptyToUndefined(value: unknown): unknown {
  if (typeof value !== 'string') {
    return value;
  }
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

export class CreateContactMessageDto {
  @Transform(({ value }) => trimString(value))
  @IsString()
  @MinLength(2)
  @MaxLength(80)
  name: string;

  @IsIn(Object.keys(CONTACT_SUBJECTS))
  subject: ContactSubject;

  @Transform(({ value }) => trimString(value))
  @IsEmail()
  @MaxLength(120)
  email: string;

  @Transform(({ value }) => emptyToUndefined(value))
  @IsOptional()
  @IsString()
  @MaxLength(30)
  phone?: string;

  @Transform(({ value }) => trimString(value))
  @IsString()
  @MinLength(10)
  @MaxLength(2000)
  message: string;

  @Transform(({ value }) => emptyToUndefined(value))
  @IsOptional()
  @IsString()
  @MaxLength(200)
  website?: string;
}
