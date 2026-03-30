import { Transform } from "class-transformer";
import { IsEmail, IsString, Length } from "class-validator";

export class VerifyOtpDto {
  @IsEmail()
  email: string;

  @Transform(({ value }) => {
    if (Array.isArray(value)) return value.join('');
    if (typeof value === 'number') return String(value);
    return value ?? '';
  })
  @IsString()
  @Length(6, 6)
  otp: string;
}