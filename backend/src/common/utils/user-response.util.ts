import { User, UserWithoutPassword } from '../../users/entities/user.entity';

export function toUserResponse(user: User | UserWithoutPassword) {
  return {
    id: user.id,
    first_name: user.first_name,
    last_name: user.last_name,
    email: user.email,
    phone: user.phone,
    county: user.county,
    city: user.city,
    street: user.street,
    postal_code: user.postal_code,
    picture: user.picture,
    role: user.role,
    is_email_verified: user.is_email_verified,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
}

export function stripPassword(user: User): UserWithoutPassword {
  const { password: _password, ...userWithoutPassword } = user;
  return userWithoutPassword;
}
