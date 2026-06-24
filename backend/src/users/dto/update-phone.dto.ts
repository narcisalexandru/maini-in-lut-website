import { Transform } from 'class-transformer';
import { IsString, Matches } from 'class-validator';
import { normalizeRomanianPhone } from '../../common/utils/phone.util';

export class UpdatePhoneDto {
  @Transform(({ value }) => {
    const normalized = normalizeRomanianPhone(String(value ?? ''));
    return normalized ?? String(value ?? '').replace(/\D/g, '');
  })
  @IsString()
  @Matches(/^0[0-9]{9}$/, {
    message: 'Phone number must be exactly 10 digits',
  })
  phone: string;
}
