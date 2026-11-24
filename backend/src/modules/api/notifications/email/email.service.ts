import { Injectable, Logger } from '@nestjs/common';
import { renderTemplate } from '../../../../common/utils/email-template.utils';
import PasswordResetTemplate from './templates/password-reset.template';
import { Resend } from 'resend';

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);

  private readonly resend = new Resend(process.env.RESEND_API_KEY);

  private get from() {
    return process.env.EMAIL_FROM ?? 'Project Buddy <onboarding@resend.dev>';
  }

  private get replyTo() {
    return process.env.EMAIL_REPLY_TO ?? process.env.EMAIL_ACCOUNT;
  }

  async sendEmail(options: { to: string; subject: string; html: string }) {
    const { data, error } = await this.resend.emails.send({
      from: this.from,
      to: [process.env.EMAIL_ACCOUNT!], // [options.to],
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
