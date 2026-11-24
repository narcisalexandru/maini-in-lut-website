import { IsEmail, IsString, MaxLength, MinLength } from 'class-validator';

export class LoginDto {
  @IsEmail()
  @MaxLength(200)
  email: string;

  @IsString()
  @MinLength(1)
  @MaxLength(200)
  password: string;
}

export class VerifyEmailDto {
  @IsString()
  @MinLength(32)
  @MaxLength(128)
  token: string;
}

export class ResendVerificationDto {
  @IsEmail()
  @MaxLength(200)
  email: string;
}
