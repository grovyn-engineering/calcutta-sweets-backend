import { Injectable } from '@nestjs/common';
import { Resend } from 'resend';

@Injectable()
export class EmailService {
  private resend = new Resend(process.env.RESEND_API_KEY);

  async sendOtpEmail(email: string, otp: string) {
    const { data, error } = await this.resend.emails.send({
      from: process.env.EMAIL_FROM || 'Calcutta Sweets <no-reply@calcutta-sweets.com>',
      to: [email],
      subject: 'Your verification code',
      html: `
        <div style="font-family: Arial;">
          <h2>Calcutta Sweets</h2>
          <p>Your OTP code is:</p>
          <h1>${otp}</h1>
          <p>This code will expire in 5 minutes.</p>
        </div>
      `,
    });

    if (error) {
      throw new Error(error.message);
    }

    return data;
  }

  async sendRoleRequestEmail(email: string, requestedRole: string, status: string) {
    const { data, error } = await this.resend.emails.send({
      from: process.env.EMAIL_FROM || 'Calcutta Sweets <no-reply@calcutta-sweets.com>',
      to: [email],
      subject: `Role Request ${status}`,
      html: `
        <div style="font-family: Arial;">
          <h2>Calcutta Sweets</h2>
          <p>Your role request for <b>${requestedRole}</b> has been <b>${status}</b>.</p>
        </div>
      `,
    });

    if (error) {
      throw new Error(error.message);
    }

    return data;
  }

  async sendWelcomeEmail(
    email: string,
    name: string,
    role: string,
    shopName: string,
  ) {
    const { data, error } = await this.resend.emails.send({
      from:
        process.env.EMAIL_FROM ||
        'Calcutta Sweets <no-reply@calcutta-sweets.com>',
      to: [email],
      subject: 'Welcome to Calcutta Sweets',
      html: `
        <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; color: #2c1810; max-width: 600px; margin: 0 auto; border: 1px solid #eee; border-radius: 12px; padding: 32px;">
          <h2 style="color: #8a6b4a; margin-top: 0;">Welcome to the Team, ${name || 'User'}!</h2>
          <p>You have been added to <b>${shopName}</b> as a <b>${role}</b>.</p>
          <div style="background: #fdfaf6; border-radius: 8px; padding: 20px; margin: 24px 0;">
            <p style="margin: 0; font-size: 14px; color: #5c4b37;">
              <b>Security Note:</b> We recommend that you change your password as soon as you log in for the first time to keep your account secure.
            </p>
          </div>
          <p>You can access the dashboard here:</p>
          <a href="http://localhost:3000" style="display: inline-block; background: #8a6b4a; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 600;">Go to Dashboard</a>
          <p style="margin-top: 32px; font-size: 12px; color: #999;">
            This is an automated message. Please do not reply to this email.
          </p>
        </div>
      `,
    });

    if (error) {
      throw new Error(error.message);
    }

    return data;
  }
}
