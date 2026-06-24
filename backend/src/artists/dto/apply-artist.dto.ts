import {
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUrl,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';

export class ApplyArtistDto {
  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  @MaxLength(120)
  artistFirstName: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  @MaxLength(120)
  artistLastName: string;

  @IsString()
  @IsNotEmpty()
  @Matches(/^\d{2,10}$/, { message: 'CUI must contain between 2 and 10 digits' })
  companyCui: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  @MaxLength(500)
  companyLegalName: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  @MaxLength(120)
  displayName: string;

  @IsEmail()
  @MaxLength(255)
  contactEmail: string;

  @IsOptional()
  @IsString()
  @MaxLength(32)
  contactPhone?: string;

  @IsOptional()
  @IsUrl({}, { message: 'Portfolio URL must be a valid URL' })
  @MaxLength(500)
  portfolioUrl?: string;
}
