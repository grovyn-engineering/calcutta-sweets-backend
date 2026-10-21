import { IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';
import { CUSTOMER_NAME_MAX_LENGTH } from '../../common/customer';

/** New saved customer for the active shop; phone is the per-shop identity key. */
export class CreateCustomerDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(CUSTOMER_NAME_MAX_LENGTH, {
    message: `name must be at most ${CUSTOMER_NAME_MAX_LENGTH} characters`,
  })
  name!: string;

  @IsString()
  @IsNotEmpty()
  phone!: string;

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
