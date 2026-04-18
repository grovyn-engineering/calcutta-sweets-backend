import { Injectable } from '@nestjs/common';
import { Resend } from 'resend';

const DEFAULT_DASHBOARD_LOGIN_URL =
  'https://calcutta-sweets.vercel.app/admin/login';

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function safeHttpUrl(raw: string, fallback: string): string {
  const t = raw.trim();
  if (!/^https?:\/\//i.test(t)) return fallback;
  try {
    const u = new URL(t);
    if (u.protocol !== 'http:' && u.protocol !== 'https:') return fallback;
    return u.toString();
  } catch {
    return fallback;
  }
}

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

  async sendPermissionRequestEmail(
    email: string,
    permissionsSummary: string,
    status: string,
  ) {
    const { data, error } = await this.resend.emails.send({
      from: process.env.EMAIL_FROM || 'Calcutta Sweets <no-reply@calcutta-sweets.com>',
      to: [email],
      subject: `Access request ${status}`,
      html: `
        <div style="font-family: Arial;">
          <h2>Calcutta Sweets</h2>
          <p>Your request for additional access (<b>${escapeHtml(permissionsSummary)}</b>) has been <b>${escapeHtml(status)}</b>.</p>
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
    plainPassword: string,
  ) {
    const loginUrl = safeHttpUrl(
      process.env.DASHBOARD_LOGIN_URL || '',
      DEFAULT_DASHBOARD_LOGIN_URL,
    );
    const safeName = escapeHtml(name || 'User');
    const safeShop = escapeHtml(shopName);
    const safeRole = escapeHtml(role);
    const safeEmail = escapeHtml(email);
    const safePassword = escapeHtml(plainPassword);

    const { data, error } = await this.resend.emails.send({
      from:
        process.env.EMAIL_FROM ||
        'Calcutta Sweets <no-reply@calcutta-sweets.com>',
      to: [email],
      subject: 'Welcome to Calcutta Sweets',
      html: `
        <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; color: #2c1810; max-width: 600px; margin: 0 auto; border: 1px solid #eee; border-radius: 12px; padding: 32px;">
          <h2 style="color: #8a6b4a; margin-top: 0;">Welcome to the Team, ${safeName}!</h2>
          <p>You have been added to <b>${safeShop}</b> as a <b>${safeRole}</b>.</p>
          <div style="background: #fdfaf6; border-radius: 8px; padding: 20px; margin: 24px 0; border: 1px solid #e8e2d9;">
            <p style="margin: 0 0 12px; font-size: 13px; color: #5c4b37; font-weight: 600;">Your sign-in details</p>
            <p style="margin: 0 0 6px; font-size: 14px; color: #2c1810;"><b>Email:</b> <span style="font-family: ui-monospace, monospace;">${safeEmail}</span></p>
            <p style="margin: 0; font-size: 14px; color: #2c1810;"><b>Temporary password:</b> <span style="font-family: ui-monospace, monospace; letter-spacing: 0.02em;">${safePassword}</span></p>
          </div>
          <div style="background: #fff9f0; border-radius: 8px; padding: 16px; margin: 20px 0; border: 1px solid #ecd18f;">
            <p style="margin: 0; font-size: 13px; color: #5c4b37;">
              <b>Please change your password</b> after you log in (Settings → Security) so your account stays secure. Do not forward this email.
            </p>
          </div>
          <p>Sign in to the admin dashboard:</p>
          <a href="${escapeHtml(loginUrl)}" style="display: inline-block; background: #8a6b4a; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 600;">Open login</a>
          <p style="margin-top: 12px; font-size: 13px; color: #6b4a30;">If the button does not work, copy this link:<br /><span style="word-break: break-all; font-family: ui-monospace, monospace; font-size: 12px;">${escapeHtml(loginUrl)}</span></p>
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
