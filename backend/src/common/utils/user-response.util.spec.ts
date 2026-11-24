import { toUserResponse } from './user-response.util';
import { User } from '../../users/entities/user.entity';
import { UserRole } from '../enums/user-role.enum';

describe('toUserResponse', () => {
  it('does not return the password or the verification token', () => {
    const user = {
      id: 1,
      first_name: 'Ana',
      last_name: 'Pop',
      email: 'ana@example.com',
      phone: '0700000000',
      county: 'SB',
      city: 'Sibiu',
      street: 'Strada',
      postal_code: '550099',
      picture: null,
      role: UserRole.CLIENT,
      is_email_verified: false,
      password: 'hashed',
      email_verification_token: 'secret-token',
      email_verification_token_expires: new Date(),
      createdAt: new Date(),
      updatedAt: new Date(),
    } as unknown as User;

    const response = toUserResponse(user);

    expect(response).not.toHaveProperty('password');
    expect(response).not.toHaveProperty('email_verification_token');
    expect(response).not.toHaveProperty('email_verification_token_expires');
    expect(response.email).toBe('ana@example.com');
  });
});
