import { BadRequestException, HttpException, HttpStatus, Injectable, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { RedisService } from '../redis.provider';
import { EmailService } from '../email/email.service';
import { JwtService } from '@nestjs/jwt';

const OTP_TTL_SECONDS = 300; // 5 minutes
const OTP_LENGTH = 6;

const ROLE_MAP: Record<string, string> = {
  admin: 'ADMIN',
  super_admin: 'SUPER_ADMIN',
  manager: 'MANAGER',
  cashier: 'CASHIER',
  staff: 'STAFF',
};

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
    private readonly emailService: EmailService,
    private readonly jwtService: JwtService,
  ) {}

  async signIn(email: string, pass: string): Promise<any> {
    const user = await this.prisma.user.findFirst({
      where: { email: email.toLowerCase().trim() as string },
    });

    console.log(user);
    console.log(pass);
    if (user?.password !== pass) {
      throw new UnauthorizedException();
    }
    const { password, ...result } = user;
    const payload = { sub: user.id as string };
    const access_token = await this.jwtService.signAsync(payload, { expiresIn: '7d' });
    const refresh_token = await this.jwtService.signAsync(payload, { expiresIn: '7d' });
    return { user: result, access_token, refresh_token };
  }

  async sendResetPasswordEmailOTP(email: string): Promise<{ message: string }> {
    const user = await this.prisma.user.findFirst({
      where: { email: email.toLowerCase().trim() as string },
    });
    if (!user) {
      // Don't reveal whether email exists
      return { message: 'If an account exists, an OTP has been sent to your email.' };
    }

    const otp = Math.floor(Math.random() * Math.pow(10, OTP_LENGTH))
      .toString()
      .padStart(OTP_LENGTH, '0');
    const emailKey = email.toLowerCase().trim() as string;

    await this.redis.set(`otp:reset:${emailKey}`, otp, 'EX', OTP_TTL_SECONDS);
    await this.emailService.sendOtpEmail(email, otp);

    return { message: 'If an account exists, an OTP has been sent to your email.' };
  }

  async verifyResetPasswordOTP(
    email: string,
    otp: string,
  ): Promise<{ verified: true }> {
    const emailKey = email.toLowerCase().trim();
    const storedOtp = await this.redis.get(`otp:reset:${emailKey}`);
    const normalizedOtp = String(otp ?? '').trim();

    if (!storedOtp || storedOtp.trim() !== normalizedOtp) {
      throw new UnauthorizedException('Invalid or expired OTP');
    }

    await this.redis.del(`otp:reset:${emailKey}`);
    return { verified: true };
  }

  private normalizeRole(role: string): 'ADMIN' | 'SUPER_ADMIN' | 'MANAGER' | 'CASHIER' | 'STAFF' {
    const r = role.toLowerCase().replace(/-/g, '_');
    const mapped = ROLE_MAP[r] || role.toUpperCase().replace(/-/g, '_');
    const validRoles = ['ADMIN', 'SUPER_ADMIN', 'MANAGER', 'CASHIER', 'STAFF'];
    if (!validRoles.includes(mapped)) {
      throw new UnauthorizedException(`Invalid role: ${role}`);
    }
    return mapped as 'ADMIN' | 'SUPER_ADMIN' | 'MANAGER' | 'CASHIER' | 'STAFF';
  }

  async verifyOtp(email: string, otp: string) {
    const emailKey = email.toLowerCase().trim();
    const storedOtp = await this.redis.get(`otp:${emailKey}`);
    const normalizedOtp = String(otp ?? '').trim();

    if (!storedOtp || storedOtp.trim() !== normalizedOtp) {
      throw new UnauthorizedException('Invalid OTP');
    }

    await this.redis.del(`otp:${emailKey}`);

    const user = await this.prisma.user.findFirst({
      where: { email },
    });
    if (!user) {
      throw new UnauthorizedException('User not found');
    }
    const { password, ...result } = user;
    return result;
  }
  async register(email: string, password: string, shopCode: string, role: string) {
    try{
      const normalizedRole = this.normalizeRole(role);
    const shop = await this.prisma.shop.findUnique({
      where: { shopCode },
    });
    if (!shop) {
      throw new BadRequestException(`Shop with code ${shopCode} not found`);
    }
    const user = await this.prisma.user.create({
      data: {
        email,
        password,
        shopCode,
        role: normalizedRole,
      },
    });
    const payload = { sub: user.id };
    return { user};
    } catch (error) {
      throw new HttpException({
        status: HttpStatus.FORBIDDEN,
        error: 'User already exists',
      }, HttpStatus.FORBIDDEN, {
        cause: error
      });
    }
  }

  async updateUser(email: string, password: string, shopCode: string, role: string, name: string) {
    const normalizedRole = this.normalizeRole(role);
    const user = await this.prisma.user.update({
      where: { email: email.toLowerCase().trim() },
      data: { password, shopCode, role: normalizedRole, name },
    });
    if (!user) {
      throw new BadRequestException(`User with email ${email} not found`);
    }
    return user;
  }
}
