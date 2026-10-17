import { IsString } from 'class-validator';

export class PurgeShopCatalogDto {
  /** Must equal the active shop code. */
  @IsString()
  confirmShopCode!: string;
}
