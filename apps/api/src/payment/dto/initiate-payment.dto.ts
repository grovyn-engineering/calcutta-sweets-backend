import {
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
} from 'class-validator';

export class InitiatePaymentDto {
  @IsUUID()
  orderId!: string;

  @IsOptional()
  @IsString()
  @MaxLength(64)
  custId?: string;

  /** Ignored: the amount always comes from the stored order. Accepted for older clients. */
  @IsOptional()
  @IsNumber()
  amount?: number;
}
