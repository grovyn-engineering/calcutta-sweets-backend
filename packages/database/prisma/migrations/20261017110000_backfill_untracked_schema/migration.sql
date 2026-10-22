-- Backfill for schema that exists in production but was applied outside migrations
-- (`prisma db push`). Without this, `migrate deploy` cannot build a working database
-- from scratch (new environments, CI). Every statement is idempotent: no-op on prod.

DO $$ BEGIN
  CREATE TYPE "OrderSource" AS ENUM ('POS', 'WEBSITE');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

ALTER TYPE "OrderStatus" ADD VALUE IF NOT EXISTS 'DRAFT';

ALTER TABLE "Shop" ADD COLUMN IF NOT EXISTS "isFactory" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Shop" ADD COLUMN IF NOT EXISTS "upiId" TEXT;
ALTER TABLE "Shop" ADD COLUMN IF NOT EXISTS "allowNextDayBooking" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Shop" ADD COLUMN IF NOT EXISTS "allowBookingWhenOutOfStock" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Shop" ADD COLUMN IF NOT EXISTS "allowShopSwitcher" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "Shop" ADD COLUMN IF NOT EXISTS "cgstRate" DOUBLE PRECISION NOT NULL DEFAULT 2.5;
ALTER TABLE "Shop" ADD COLUMN IF NOT EXISTS "sgstRate" DOUBLE PRECISION NOT NULL DEFAULT 2.5;

ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "phone" TEXT;

ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "isListedOnWebsite" BOOLEAN NOT NULL DEFAULT false;

ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS "orderSource" "OrderSource" NOT NULL DEFAULT 'POS';
ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS "pickupTime" TIMESTAMP(3);

ALTER TABLE "OrderItem" ADD COLUMN IF NOT EXISTS "customName" TEXT;
ALTER TABLE "OrderItem" ALTER COLUMN "productId" DROP NOT NULL;

ALTER TABLE "OrderItem" DROP CONSTRAINT IF EXISTS "OrderItem_orderId_fkey";
ALTER TABLE "OrderItem" ADD CONSTRAINT "OrderItem_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE INDEX IF NOT EXISTS "Product_categoryId_idx" ON "Product"("categoryId");
CREATE INDEX IF NOT EXISTS "Product_shopCode_idx" ON "Product"("shopCode");
CREATE INDEX IF NOT EXISTS "ProductVariant_productId_idx" ON "ProductVariant"("productId");
