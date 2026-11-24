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
  contactFirstName: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  @MaxLength(120)
  contactLastName: string;

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
