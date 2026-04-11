import { IsString, IsNotEmpty, IsOptional, IsArray, ValidateNested, IsNumber, Min } from 'class-validator';
import { Type } from 'class-transformer';

class InventoryItemDto {
  @IsString()
  @IsNotEmpty()
  variantId!: string;

  @IsNumber()
  @Min(0)
  quantity!: number;
}

export class CreateShopWithInventoryDto {
  @IsString()
  @IsNotEmpty()
  name!: string;

  @IsString()
  @IsOptional()
  shopCode?: string;

  @IsString()
  @IsOptional()
  currency?: string;

  @IsString()
  @IsNotEmpty()
  sourceShopCode!: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => InventoryItemDto)
  @IsOptional()
  initialInventory?: InventoryItemDto[];
}
