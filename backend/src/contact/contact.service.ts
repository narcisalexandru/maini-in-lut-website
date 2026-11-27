import {
  BadRequestException,
  Injectable,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { EmailService } from '../email/email.service';
import {
  CONTACT_SUBJECTS,
  CreateContactMessageDto,
} from './dto/create-contact-message.dto';

const ROMANIAN_PHONE_PATTERN = /^0[0-9]{9}$/;

export function normalizeContactPhone(input: string): string | null {
  const digits = input.replace(/\D/g, '');
  if (!digits) {
    return null;
  }

  let normalized: string;
  if (digits.length === 11 && digits.startsWith('40')) {
    normalized = `0${digits.slice(2)}`;
  } else if (digits.length === 10) {
    normalized = digits;
  } else {
    return null;
  }

  return ROMANIAN_PHONE_PATTERN.test(normalized) ? normalized : null;
}

@Injectable()
export class ContactService {
  constructor(
    private readonly emailService: EmailService,
    private readonly configService: ConfigService,
  ) {}

  async submit(dto: CreateContactMessageDto): Promise<{ ok: true }> {
    if (dto.website) {
      return { ok: true };
    }

    const phone = dto.phone ? normalizeContactPhone(dto.phone) : null;
    if (dto.phone && !phone) {
      throw new BadRequestException('Numărul de telefon nu este valid.');
    }

    const inbox =
      this.configService.get<string>('ORDER_NOTIFICATION_EMAIL')?.trim() ||
      this.configService.get<string>('SMTP_FROM_EMAIL')?.trim();
    if (!inbox) {
      throw new ServiceUnavailableException(
        'Mesajul nu a putut fi trimis. Scrie-ne direct pe email.',
      );
    }

    try {
      await this.emailService.sendContactMessage(inbox, {
        name: dto.name,
        email: dto.email,
        phone,
        subject: CONTACT_SUBJECTS[dto.subject],
        message: dto.message,
      });
    } catch {
      throw new ServiceUnavailableException(
        'Mesajul nu a putut fi trimis. Încearcă din nou sau scrie-ne direct pe email.',
      );
    }

    return { ok: true };
  }
}
