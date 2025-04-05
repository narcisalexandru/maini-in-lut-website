import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import { renderFile } from 'ejs';
import * as path from 'path';

@Injectable()
export class EmailService {
  private transporter;
  private readonly templatePath: string;

  constructor(private configService: ConfigService) {
    this.transporter = nodemailer.createTransport({
      service: 'gmail',
      host: this.configService.get('SMTP_HOST'),
      port: this.configService.get('SMTP_PORT'),
      secure: false,
      auth: {
        user: this.configService.get('SMTP_USER'),
        pass: this.configService.get('SMTP_PASS'),
      },
      tls: {
        rejectUnauthorized: false,
      },
    });

    this.templatePath = path.join(
      process.cwd(),
      'src',
      'email',
      'templates',
      'email-verification.ejs',
    );
  }

  async sendVerificationEmail(
    email: string,
    first_name: string,
    last_name: string,
    verificationLink: string,
  ) {
    const html = await renderFile(this.templatePath, {
      first_name,
      last_name,
      verificationLink,
    });

    await this.transporter.sendMail({
      from: `"${this.configService.get(
        'SMTP_FROM_NAME',
      )}" <${this.configService.get('SMTP_FROM_EMAIL')}>`,
      to: email,
      subject: 'Verify your email address',
      html,
    });
  }
}
