import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import { renderFile } from 'ejs';
import * as path from 'path';
import Mail from 'nodemailer/lib/mailer';

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

  private templateFile(name: string): string {
    return path.join(process.cwd(), 'src', 'email', 'templates', name);
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

  async sendArtistApplicationNotification(
    to: string,
    payload: {
      applicantName: string;
      applicantEmail: string;
      applicantPhone: string | null;
      artistFirstName: string | null;
      artistLastName: string | null;
      companyCui: string | null;
      companyLegalName: string | null;
      displayName: string;
      contactEmail: string | null;
      contactPhone: string | null;
      portfolioUrl: string | null;
      adminUrl: string;
    },
  ): Promise<void> {
    const html = await renderFile(
      this.templateFile('artist-application.ejs'),
      payload,
    );

    await this.transporter.sendMail({
      from: `"${this.configService.get(
        'SMTP_FROM_NAME',
      )}" <${this.configService.get('SMTP_FROM_EMAIL')}>`,
      to,
      subject: `Cerere nouă artist: ${payload.displayName}`,
      html,
    });
  }

  async sendArtistApplicationReceived(
    to: string,
    payload: {
      firstName: string;
      artistFirstName: string | null;
      artistLastName: string | null;
      companyCui: string | null;
      companyLegalName: string | null;
      displayName: string;
      contactEmail: string | null;
      contactPhone: string | null;
      portfolioUrl: string | null;
    },
  ): Promise<void> {
    const html = await renderFile(
      this.templateFile('artist-application-received.ejs'),
      payload,
    );

    await this.transporter.sendMail({
      from: `"${this.configService.get(
        'SMTP_FROM_NAME',
      )}" <${this.configService.get('SMTP_FROM_EMAIL')}>`,
      to,
      subject: 'Cererea ta de artist a fost trimisă',
      html,
    });
  }

  async sendArtistApplicationApproved(
    to: string,
    payload: {
      firstName: string;
      displayName: string;
      panelUrl: string;
    },
  ): Promise<void> {
    const html = await renderFile(
      this.templateFile('artist-application-approved.ejs'),
      payload,
    );

    await this.transporter.sendMail({
      from: `"${this.configService.get(
        'SMTP_FROM_NAME',
      )}" <${this.configService.get('SMTP_FROM_EMAIL')}>`,
      to,
      subject: `Cererea ta a fost aprobată: ${payload.displayName}`,
      html,
    });
  }

  async sendArtistApplicationRejected(
    to: string,
    payload: {
      firstName: string;
      displayName: string;
      rejectionReason: string;
      reapplyUrl: string;
    },
  ): Promise<void> {
    const html = await renderFile(
      this.templateFile('artist-application-rejected.ejs'),
      payload,
    );

    await this.transporter.sendMail({
      from: `"${this.configService.get(
        'SMTP_FROM_NAME',
      )}" <${this.configService.get('SMTP_FROM_EMAIL')}>`,
      to,
      subject: `Cererea ta a fost respinsă: ${payload.displayName}`,
      html,
    });
  }

  async sendArtistAccountSuspended(
    to: string,
    payload: {
      firstName: string;
      displayName: string;
      suspensionReason: string;
      suspendedAt: string;
      contactUrl: string;
    },
  ): Promise<void> {
    const html = await renderFile(
      this.templateFile('artist-account-suspended.ejs'),
      payload,
    );

    await this.transporter.sendMail({
      from: `"${this.configService.get(
        'SMTP_FROM_NAME',
      )}" <${this.configService.get('SMTP_FROM_EMAIL')}>`,
      to,
      subject: `Cont suspendat: ${payload.displayName}`,
      html,
    });
  }

  async sendArtistAccountReactivated(
    to: string,
    payload: {
      firstName: string;
      displayName: string;
      reactivatedAt: string;
      panelUrl: string;
    },
  ): Promise<void> {
    const html = await renderFile(
      this.templateFile('artist-account-reactivated.ejs'),
      payload,
    );

    await this.transporter.sendMail({
      from: `"${this.configService.get(
        'SMTP_FROM_NAME',
      )}" <${this.configService.get('SMTP_FROM_EMAIL')}>`,
      to,
      subject: `Cont reactivat: ${payload.displayName}`,
      html,
    });
  }

  async sendProductChangeRequestNotification(
    to: string,
    payload: {
      artistName: string;
      productTitle: string;
      adminUrl: string;
      changeItems: Array<{
        label: string;
        before: string;
        after: string;
      }>;
    },
  ): Promise<void> {
    const html = await renderFile(
      this.templateFile('product-change-request.ejs'),
      payload,
    );

    await this.transporter.sendMail({
      from: `"${this.configService.get(
        'SMTP_FROM_NAME',
      )}" <${this.configService.get('SMTP_FROM_EMAIL')}>`,
      to,
      subject: `Modificări produs de validat: ${payload.productTitle}`,
      html,
    });
  }

  async sendArtistAccountDeletionRequest(
    to: string,
    payload: {
      applicantName: string;
      requestedAt: string;
      userFirstName: string;
      userLastName: string;
      userEmail: string;
      userPhone: string | null;
      displayName: string | null;
      artistFirstName: string | null;
      artistLastName: string | null;
      companyCui: string | null;
      companyLegalName: string | null;
      contactEmail: string | null;
      contactPhone: string | null;
      adminUrl: string | null;
    },
  ): Promise<void> {
    const html = await renderFile(
      this.templateFile('artist-account-deletion-request.ejs'),
      payload,
    );

    await this.transporter.sendMail({
      from: `"${this.configService.get(
        'SMTP_FROM_NAME',
      )}" <${this.configService.get('SMTP_FROM_EMAIL')}>`,
      to,
      subject: `Cerere ștergere cont artist: ${payload.applicantName}`,
      html,
    });
  }

  async sendOrderNotificationEmail(
    to: string,
    subject: string,
    html: string,
    attachments?: Mail.Attachment[],
  ): Promise<void> {
    await this.transporter.sendMail({
      from: `"${this.configService.get(
        'SMTP_FROM_NAME',
      )}" <${this.configService.get('SMTP_FROM_EMAIL')}>`,
      to,
      subject,
      html,
      attachments,
    });
  }
}
