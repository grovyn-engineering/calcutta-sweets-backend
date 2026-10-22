import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsDateString,
  IsEmail,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';
import { CUSTOMER_NAME_MAX_LENGTH } from '../../common/customer';

export class WebsiteOrderLineDto {
  /** Ignored by the server (the variant determines the product); kept for existing clients. */
  @IsOptional()
  @IsString()
  productId?: string;

  @IsUUID()
  variantId!: string;

  @Type(() => Number)
  @IsNumber()
  @Min(0.001)
  @Max(1000)
  quantity!: number;
}

export class CreateWebsiteOrderDto {
  @IsString()
  @MaxLength(64)
  shopCode!: string;

  @IsString()
  @MaxLength(CUSTOMER_NAME_MAX_LENGTH)
  customerName!: string;

  @IsString()
  customerPhone!: string;

  @IsOptional()
  @IsEmail()
  customerEmail?: string;

  @IsDateString()
  pickupTime!: string;

  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(50)
  @ValidateNested({ each: true })
  @Type(() => WebsiteOrderLineDto)
  items!: WebsiteOrderLineDto[];
}
