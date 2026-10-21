import { IsOptional, IsString, MaxLength, MinLength } from 'class-validator';
import { CUSTOMER_NAME_MAX_LENGTH } from '../../common/customer';

/** Editable customer fields. Empty strings clear optional fields; `phone` is role-gated in the service. */
export class UpdateCustomerDto {
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(CUSTOMER_NAME_MAX_LENGTH, {
    message: `name must be at most ${CUSTOMER_NAME_MAX_LENGTH} characters`,
  })
  name?: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsString()
  @MaxLength(254)
  email?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  address?: string;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  notes?: string;

  @IsOptional()
  @IsString()
  @MaxLength(15)
  gstin?: string;
}
