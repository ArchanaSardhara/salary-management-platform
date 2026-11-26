import { Injectable, Logger } from '@nestjs/common';
import { Resend } from 'resend';

import { renderTemplate } from '../../../../common/utils/email-template.utils';
import EmailVerificationTemplate from './templates/email-verification.template';
import PasswordResetTemplate from './templates/password-reset.template';

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);

  // Null when RESEND_API_KEY is absent (e.g. local dev without email configured).
  private readonly resend: Resend | null = process.env.RESEND_API_KEY
    ? new Resend(process.env.RESEND_API_KEY)
    : null;

  private get from() {
    return (
      process.env.EMAIL_FROM ?? 'Salary Management <onboarding@resend.dev>'
    );
  }

  private get replyTo() {
    return process.env.EMAIL_REPLY_TO!;
  }

  async sendEmail(options: { to: string; subject: string; html: string }) {
    if (!this.resend) {
      this.logger.warn(
        `RESEND_API_KEY not configured — email to ${options.to} not sent`,
      );
      return;
    }

    const { data, error } = await this.resend.emails.send({
      from: this.from,
      to: [this.replyTo], // [options.to],
      replyTo: this.replyTo,
      subject: options.subject,
      html: options.html,
    });

    if (error) {
      this.logger.error(`Failed to send email: ${error.message}`);
      throw error;
    }

    this.logger.log(`Email sent: ${data?.id}`);
    return data;
  }

  async sendVerificationEmail(options: {
    to: string;
    firstName: string;
    token: string;
  }) {
    const frontendUrl = process.env.APP_URL;
    if (!frontendUrl) {
      throw new Error('APP_URL is not configured');
    }

    const verificationUrl =
      `${frontendUrl}/verify-email?token=` + encodeURIComponent(options.token);

    const html = renderTemplate(EmailVerificationTemplate, {
      firstName: options.firstName,
      verificationUrl,
    });

    return this.sendEmail({
      to: options.to,
      subject: 'Verify your email address',
      html,
    });
  }

  async sendPasswordResetEmail(options: {
    to: string;
    firstName: string;
    token: string;
  }) {
    const frontendUrl = process.env.APP_URL;
    if (!frontendUrl) {
      throw new Error('APP_URL is not configured');
    }

    const resetUrl =
      `${frontendUrl}/reset-password?token=` +
      encodeURIComponent(options.token);

    const html = renderTemplate(PasswordResetTemplate, {
      firstName: options.firstName,
      resetUrl,
    });

    return this.sendEmail({
      to: options.to,
      subject: 'Reset your password',
      html,
    });
  }
}
