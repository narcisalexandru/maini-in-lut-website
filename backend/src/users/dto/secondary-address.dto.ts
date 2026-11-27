import { IsOptional, IsString } from 'class-validator';

export class SecondaryAddressDto {
  @IsOptional()
  @IsString()
  label?: string;

  @IsString()
  county: string;

  @IsString()
  city: string;

  @IsString()
  street: string;

  @IsString()
  postal_code: string;
}
