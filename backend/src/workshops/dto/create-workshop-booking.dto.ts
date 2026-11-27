import { Type } from 'class-transformer';
import {
  IsEmail,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';
import { WorkshopPaymentMethod } from '../enums/workshop-payment.enum';

export class CreateWorkshopBookingDto {
  @IsString()
  @MinLength(2)
  @MaxLength(80)
  firstName: string;

  @IsString()
  @MinLength(2)
  @MaxLength(80)
  lastName: string;

  @IsEmail()
  @MaxLength(180)
  email: string;

  @IsString()
  @MinLength(8)
  @MaxLength(32)
  phone: string;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(20)
  spots: number;

  @IsEnum(WorkshopPaymentMethod)
  paymentMethod: WorkshopPaymentMethod;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  successUrl?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  cancelUrl?: string;
}
