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
  @Matches(/^[0-9]{10}$/, { message: 'Phone number must be exactly 10 digits' })
  phone?: string;

  @IsString()
  @IsOptional()
  picture?: string;

  @IsString()
  @IsOptional()
  @Matches(/^[a-zA-Z\s]*$/, {
    message: 'County must contain only letters and spaces',
  })
  county?: string;

  @IsString()
  @IsOptional()
  @Matches(/^[a-zA-Z\s]*$/, {
    message: 'City must contain only letters and spaces',
  })
  city?: string;

  @IsString()
  @IsOptional()
  @Matches(/^[a-zA-Z0-9\s]*$/, {
    message: 'Street must contain only letters, numbers and spaces',
  })
  street?: string;

  @IsString()
  @IsOptional()
  @Matches(/^[0-9]{6}$/, { message: 'Postal code must be exactly 6 digits' })
  postal_code?: string;

  @IsBoolean()
  @IsOptional()
  is_email_verified?: boolean;

  @IsString()
  @IsOptional()
  email_verification_token?: string;

  @IsOptional()
  email_verification_token_expires?: Date;
}
