import {
  IsEmail,
  IsString,
  MinLength,
  Matches,
  IsNotEmpty,
  IsOptional,
  IsBoolean,
  Validate,
  ValidationArguments,
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from 'class-validator';

@ValidatorConstraint({ name: 'password', async: false })
export class PasswordValidator implements ValidatorConstraintInterface {
  validate(password: string, args: ValidationArguments) {
    const hasUpperCase = /[A-Z]/.test(password);
    const hasTwoNumbers = /.*\d.*\d/.test(password);
    const hasSpecialChar = /[!@#$%^&*]/.test(password);
    const hasMinLength = password.length >= 8;

    return hasUpperCase && hasTwoNumbers && hasSpecialChar && hasMinLength;
  }

  defaultMessage(args: ValidationArguments) {
    return 'Password must contain at least one uppercase letter, two numbers, one special character, and be at least 8 characters long';
  }
}

export class CreateUserDto {
  @IsEmail({}, { message: 'Please provide a valid email address' })
  @IsNotEmpty({ message: 'Email is required' })
  email: string;

  @IsString()
  @IsNotEmpty({ message: 'Password is required' })
  @Validate(PasswordValidator)
  password: string;

  @IsString()
  @IsNotEmpty({ message: 'First name is required' })
  first_name: string;

  @IsString()
  @IsNotEmpty({ message: 'Last name is required' })
  last_name: string;

  @IsString()
  @IsOptional()
  picture?: string;

  @IsString()
  @IsOptional()
  address?: string;

  @IsBoolean()
  @IsOptional()
  is_email_verified?: boolean;

  @IsString()
  @IsOptional()
  email_verification_token?: string;

  @IsOptional()
  email_verification_token_expires?: Date;
}
