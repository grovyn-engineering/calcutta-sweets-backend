import { Body, Controller, Post, UseGuards, Req } from '@nestjs/common';
import { Request } from 'express';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './jwt-auth.guard';
import { VerifyOtpDto } from './dto/verify-dto.dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) { }

  @Post('login')
  login(@Body() loginDto: { email: string; password: string }) {
    return this.authService.signIn(loginDto.email, loginDto.password);
  }

  @Post('update')
  update(@Body() updateDto: { email: string; password: string; shopCode: string; role: string, name: string }) {
    return this.authService.updateUser(updateDto.email, updateDto.password, updateDto.shopCode, updateDto.role, updateDto.name);
  }
  @Post('register')
  register(@Body() registerDto: { email: string; password: string; shopCode: string; role: string }) {
    return this.authService.register(
      registerDto.email,
      registerDto.password,
      registerDto.shopCode,
      registerDto.role,
    );
  }

  @Post('verify-otp')
  verifyOtp(@Body() dto: VerifyOtpDto) {
    return this.authService.verifyOtp(dto.email, dto.otp);
  }

  @Post('verify-reset-password')
  verifyResetPassword(@Body() dto: VerifyOtpDto) {
    return this.authService.verifyResetPasswordOTP(dto.email, dto.otp);
  }

  @Post('forgot-password')
  forgotPassword(@Body() forgotPasswordDto: { email: string }) {
    return this.authService.sendResetPasswordEmailOTP(forgotPasswordDto.email);
  }
  @Post('reset-password')
  resetPassword(@Body() dto: { email: string; otp: string; newPassword: string }) {
    if (dto.newPassword.length < 8) throw new Error('Password must be at least 8 characters long');
    // High security validation could be expanded here.
    return this.authService.resetPassword(dto.email, dto.otp, dto.newPassword);
  }

  @UseGuards(JwtAuthGuard)
  @Post('send-change-password-otp')
  sendChangePasswordOtp(@Req() req: Request) {
    return this.authService.sendChangePasswordEmailOTP((req.user as any).sub || (req.user as any).id);
  }

  @UseGuards(JwtAuthGuard)
  @Post('change-password')
  changePassword(@Req() req: Request, @Body() dto: { oldPassword: string; newPassword: string; otp: string }) {
    if (dto.newPassword.length < 8) throw new Error('Password must be at least 8 characters long');
    return this.authService.changePassword((req.user as any).sub || (req.user as any).id, dto.oldPassword, dto.newPassword, dto.otp);
  }
}
