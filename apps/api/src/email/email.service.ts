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
}
