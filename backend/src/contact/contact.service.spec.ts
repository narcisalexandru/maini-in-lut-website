import { BadRequestException, ServiceUnavailableException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { EmailService } from '../email/email.service';
import { ContactService } from './contact.service';
import { CreateContactMessageDto } from './dto/create-contact-message.dto';

describe('ContactService', () => {
  const emailService = {
    sendContactMessage: jest.fn(),
  };
  const configService = {
    get: jest.fn(),
  };

  const service = new ContactService(
    emailService as unknown as EmailService,
    configService as unknown as ConfigService,
  );

  const message: CreateContactMessageDto = {
    name: 'Ana Pop',
    email: 'ana@example.com',
    phone: '0771 032 007',
    subject: 'product',
    message: 'Aș vrea detalii despre o cană.',
  };

  beforeEach(() => {
    jest.clearAllMocks();
    configService.get.mockImplementation((key: string) =>
      key === 'ORDER_NOTIFICATION_EMAIL' ? 'shop@example.com' : undefined,
    );
  });

  it('sends the message to the workshop inbox', async () => {
    await expect(service.submit(message)).resolves.toEqual({ ok: true });

    expect(emailService.sendContactMessage).toHaveBeenCalledWith('shop@example.com', {
      name: 'Ana Pop',
      email: 'ana@example.com',
      phone: '0771032007',
      subject: 'Produs',
      message: 'Aș vrea detalii despre o cană.',
    });
  });

  it('ignores messages that fill the hidden field', async () => {
    await expect(service.submit({ ...message, website: 'https://spam.example' })).resolves.toEqual({
      ok: true,
    });

    expect(emailService.sendContactMessage).not.toHaveBeenCalled();
  });

  it('rejects an invalid phone number', async () => {
    await expect(service.submit({ ...message, phone: '123' })).rejects.toBeInstanceOf(
      BadRequestException,
    );
    expect(emailService.sendContactMessage).not.toHaveBeenCalled();
  });

  it('reports when email delivery is not configured', async () => {
    configService.get.mockReturnValue(undefined);

    await expect(service.submit(message)).rejects.toBeInstanceOf(ServiceUnavailableException);
  });
});
