-- Data-integrity hardening (see tasks.md).
-- Written to be safe on the production DB, which may already have been patched by hand
-- (billNo / transactionId / InvoiceSequence were added to schema.prisma without a migration).

-- ---------------------------------------------------------------------------
-- Enums
-- ---------------------------------------------------------------------------
DO $$ BEGIN
  CREATE TYPE "PaymentMethod" AS ENUM ('CASH', 'UPI_CARD', 'ONLINE');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE "StockMovementReason" AS ENUM ('SALE', 'SALE_CANCEL', 'WEB_SALE', 'TRANSFER_OUT', 'TRANSFER_IN', 'ADJUSTMENT', 'CATALOG_SYNC', 'SHOP_SEED');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ---------------------------------------------------------------------------
-- B-01: columns/tables that schema.prisma referenced without a migration
-- ---------------------------------------------------------------------------
ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS "billNo" TEXT;
ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS "transactionId" TEXT;
UPDATE "Order" SET "transactionId" = gen_random_uuid()::text WHERE "transactionId" IS NULL;
ALTER TABLE "Order" ALTER COLUMN "transactionId" SET NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS "Order_transactionId_key" ON "Order"("transactionId");

CREATE TABLE IF NOT EXISTS "InvoiceSequence" (
    "id" TEXT NOT NULL,
    "current" INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT "InvoiceSequence_pkey" PRIMARY KEY ("id")
);

-- ---------------------------------------------------------------------------
-- B-08: cancellation instead of hard delete
-- ---------------------------------------------------------------------------
ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS "cancelledAt" TIMESTAMP(3);
ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS "cancelReason" TEXT;
ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS "cancelledById" TEXT;

-- ---------------------------------------------------------------------------
-- B-21: money and quantities as DECIMAL
-- ---------------------------------------------------------------------------
UPDATE "Order" SET "discount" = 0 WHERE "discount" IS NULL;
UPDATE "Order" SET "tax" = 0 WHERE "tax" IS NULL;
ALTER TABLE "Order"
  ALTER COLUMN "totalAmount" SET DATA TYPE DECIMAL(12,2) USING round("totalAmount"::numeric, 2),
  ALTER COLUMN "discount" SET DATA TYPE DECIMAL(12,2) USING round("discount"::numeric, 2),
  ALTER COLUMN "discount" SET NOT NULL,
  ALTER COLUMN "tax" SET DATA TYPE DECIMAL(12,2) USING round("tax"::numeric, 2),
  ALTER COLUMN "tax" SET NOT NULL;

-- B-33: paymentMethod String -> enum, keeping existing values
ALTER TABLE "Order" ALTER COLUMN "paymentMethod" DROP DEFAULT;
ALTER TABLE "Order" ALTER COLUMN "paymentMethod" SET DATA TYPE "PaymentMethod"
  USING (CASE WHEN "paymentMethod"::text IN ('CASH', 'UPI_CARD', 'ONLINE') THEN "paymentMethod"::text ELSE 'CASH' END)::"PaymentMethod";
ALTER TABLE "Order" ALTER COLUMN "paymentMethod" SET DEFAULT 'CASH';

-- Stock: one production variant holds ~1e16 (stock padded to bypass "Insufficient stock").
-- DECIMAL(12,3) cannot store it, so clamp anything >= 1,000,000 to 100,000 and record it below.
CREATE TEMP TABLE "_clamped_stock" AS
  SELECT "id", "quantity" AS "old_quantity" FROM "ProductVariant" WHERE "quantity" >= 1000000;
UPDATE "ProductVariant" SET "quantity" = 100000 WHERE "id" IN (SELECT "id" FROM "_clamped_stock");

ALTER TABLE "ProductVariant"
  ALTER COLUMN "price" SET DATA TYPE DECIMAL(12,2) USING round("price"::numeric, 2),
  ALTER COLUMN "costPrice" SET DATA TYPE DECIMAL(12,2) USING round("costPrice"::numeric, 2),
  ALTER COLUMN "quantity" SET DATA TYPE DECIMAL(12,3) USING round("quantity"::numeric, 3),
  ALTER COLUMN "minStock" SET DATA TYPE DECIMAL(12,3) USING round("minStock"::numeric, 3);

ALTER TABLE "OrderItem"
  ALTER COLUMN "quantity" SET DATA TYPE DECIMAL(12,3) USING round("quantity"::numeric, 3),
  ALTER COLUMN "price" SET DATA TYPE DECIMAL(12,2) USING round("price"::numeric, 2),
  ALTER COLUMN "posLabelQuantity" SET DATA TYPE DECIMAL(12,3) USING round("posLabelQuantity"::numeric, 3);

ALTER TABLE "Shop"
  ALTER COLUMN "cgstRate" SET DATA TYPE DECIMAL(5,2) USING round("cgstRate"::numeric, 2),
  ALTER COLUMN "sgstRate" SET DATA TYPE DECIMAL(5,2) USING round("sgstRate"::numeric, 2);

-- B-12: fractional (kg) transfers
ALTER TABLE "StockTransferItem" ALTER COLUMN "quantity" SET DATA TYPE DECIMAL(12,3) USING "quantity"::numeric;

-- ---------------------------------------------------------------------------
-- B-22 / B-23: per-line snapshot and tax
-- ---------------------------------------------------------------------------
ALTER TABLE "OrderItem" ADD COLUMN IF NOT EXISTS "productName" TEXT;
ALTER TABLE "OrderItem" ADD COLUMN IF NOT EXISTS "variantName" TEXT;
ALTER TABLE "OrderItem" ADD COLUMN IF NOT EXISTS "barcode" TEXT;
ALTER TABLE "OrderItem" ADD COLUMN IF NOT EXISTS "hsnCode" TEXT;
ALTER TABLE "OrderItem" ADD COLUMN IF NOT EXISTS "taxRate" DECIMAL(5,2) NOT NULL DEFAULT 0;
ALTER TABLE "OrderItem" ADD COLUMN IF NOT EXISTS "taxAmount" DECIMAL(12,2) NOT NULL DEFAULT 0;

UPDATE "OrderItem" i SET
  "productName" = COALESCE(i."customName", p."name"),
  "variantName" = v."name",
  "barcode" = v."barcode",
  "hsnCode" = v."hsnCode"
FROM "OrderItem" i2
LEFT JOIN "ProductVariant" v ON v."id" = i2."productVariantId"
LEFT JOIN "Product" p ON p."id" = COALESCE(i2."productId", v."productId")
WHERE i2."id" = i."id";

-- Historic lines: shop rate, and the order's stored tax split by line value.
WITH line AS (
  SELECT i."id", o."tax", s."cgstRate" + s."sgstRate" AS "rate",
         i."quantity" * i."price" AS "gross",
         SUM(i."quantity" * i."price") OVER (PARTITION BY i."orderId") AS "orderGross"
  FROM "OrderItem" i
  JOIN "Order" o ON o."id" = i."orderId"
  JOIN "Shop" s ON s."shopCode" = o."shopCode"
)
UPDATE "OrderItem" i SET
  "taxRate" = line."rate",
  "taxAmount" = CASE WHEN line."orderGross" > 0 THEN round(line."tax" * line."gross" / line."orderGross", 2) ELSE 0 END
FROM line WHERE line."id" = i."id";

ALTER TABLE "ProductVariant" ADD COLUMN IF NOT EXISTS "taxRate" DECIMAL(5,2);

-- ---------------------------------------------------------------------------
-- B-20: barcode unique per shop (denormalised shopCode on the variant)
-- ---------------------------------------------------------------------------
ALTER TABLE "ProductVariant" ADD COLUMN IF NOT EXISTS "shopCode" TEXT;
UPDATE "ProductVariant" v SET "shopCode" = p."shopCode" FROM "Product" p WHERE p."id" = v."productId" AND v."shopCode" IS NULL;
ALTER TABLE "ProductVariant" ALTER COLUMN "shopCode" SET NOT NULL;
DROP INDEX IF EXISTS "ProductVariant_productId_barcode_key";
CREATE UNIQUE INDEX IF NOT EXISTS "ProductVariant_shopCode_barcode_key" ON "ProductVariant"("shopCode", "barcode");

-- Counters for generated codes, seeded from existing data so new codes never collide.
INSERT INTO "InvoiceSequence" ("id", "current")
SELECT 'BARCODE-' || "shopCode", MAX(substring("barcode" FROM '^CS([0-9]+)$')::int)
FROM "ProductVariant" WHERE "barcode" ~ '^CS[0-9]+$' GROUP BY "shopCode"
ON CONFLICT ("id") DO UPDATE SET "current" = GREATEST("InvoiceSequence"."current", EXCLUDED."current");

INSERT INTO "InvoiceSequence" ("id", "current")
SELECT 'SHOPCODE', COALESCE(MAX(substring("shopCode" FROM '^SH([0-9]+)$')::int), 0) FROM "Shop"
ON CONFLICT ("id") DO UPDATE SET "current" = GREATEST("InvoiceSequence"."current", EXCLUDED."current");

-- ---------------------------------------------------------------------------
-- B-15: stock ledger
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS "StockMovement" (
    "id" TEXT NOT NULL,
    "shopCode" TEXT NOT NULL,
    "variantId" TEXT,
    "reason" "StockMovementReason" NOT NULL,
    "delta" DECIMAL(12,3) NOT NULL,
    "balance" DECIMAL(12,3) NOT NULL,
    "refId" TEXT,
    "note" TEXT,
    "userId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "StockMovement_pkey" PRIMARY KEY ("id")
);

-- Opening balance for every variant, so SUM(delta) always equals quantity.
INSERT INTO "StockMovement" ("id", "shopCode", "variantId", "reason", "delta", "balance", "note")
SELECT gen_random_uuid()::text, v."shopCode", v."id", 'ADJUSTMENT', v."quantity", v."quantity",
       CASE WHEN c."id" IS NOT NULL
            THEN 'Opening balance (migration). Clamped from ' || c."old_quantity"::text || ' to 100000.'
            ELSE 'Opening balance (migration)' END
FROM "ProductVariant" v
LEFT JOIN "_clamped_stock" c ON c."id" = v."id"
WHERE NOT EXISTS (SELECT 1 FROM "StockMovement" m WHERE m."variantId" = v."id");

DROP TABLE "_clamped_stock";

-- ---------------------------------------------------------------------------
-- Indexes
-- ---------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS "StockMovement_variantId_createdAt_idx" ON "StockMovement"("variantId", "createdAt");
CREATE INDEX IF NOT EXISTS "StockMovement_shopCode_createdAt_idx" ON "StockMovement"("shopCode", "createdAt");
CREATE INDEX IF NOT EXISTS "Order_shopCode_createdAt_idx" ON "Order"("shopCode", "createdAt");
CREATE UNIQUE INDEX IF NOT EXISTS "Order_shopCode_billNo_key" ON "Order"("shopCode", "billNo");
CREATE INDEX IF NOT EXISTS "OrderItem_orderId_idx" ON "OrderItem"("orderId");
CREATE INDEX IF NOT EXISTS "OrderItem_productVariantId_idx" ON "OrderItem"("productVariantId");

-- ---------------------------------------------------------------------------
-- Foreign keys
-- ---------------------------------------------------------------------------
ALTER TABLE "ProductImage" DROP CONSTRAINT IF EXISTS "ProductImage_productId_fkey";
ALTER TABLE "ProductImage" ADD CONSTRAINT "ProductImage_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "ProductVariant" DROP CONSTRAINT IF EXISTS "ProductVariant_productId_fkey";
ALTER TABLE "ProductVariant" ADD CONSTRAINT "ProductVariant_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "ProductVariant" DROP CONSTRAINT IF EXISTS "ProductVariant_shopCode_fkey";
ALTER TABLE "ProductVariant" ADD CONSTRAINT "ProductVariant_shopCode_fkey" FOREIGN KEY ("shopCode") REFERENCES "Shop"("shopCode") ON DELETE RESTRICT ON UPDATE CASCADE;

-- B-06: deleting a variant/product must never delete sales lines.
ALTER TABLE "OrderItem" DROP CONSTRAINT IF EXISTS "OrderItem_productVariantId_fkey";
ALTER TABLE "OrderItem" ADD CONSTRAINT "OrderItem_productVariantId_fkey" FOREIGN KEY ("productVariantId") REFERENCES "ProductVariant"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "OrderItem" DROP CONSTRAINT IF EXISTS "OrderItem_productId_fkey";
ALTER TABLE "OrderItem" ADD CONSTRAINT "OrderItem_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "Order" DROP CONSTRAINT IF EXISTS "Order_createdById_fkey";
ALTER TABLE "Order" ADD CONSTRAINT "Order_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Order" DROP CONSTRAINT IF EXISTS "Order_cancelledById_fkey";
ALTER TABLE "Order" ADD CONSTRAINT "Order_cancelledById_fkey" FOREIGN KEY ("cancelledById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- B-32: transfer actors become real relations (orphan ids cleared first)
UPDATE "StockTransferRequest" t SET "createdById" = NULL WHERE "createdById" IS NOT NULL AND NOT EXISTS (SELECT 1 FROM "User" u WHERE u."id" = t."createdById");
UPDATE "StockTransferRequest" t SET "approvedById" = NULL WHERE "approvedById" IS NOT NULL AND NOT EXISTS (SELECT 1 FROM "User" u WHERE u."id" = t."approvedById");
ALTER TABLE "StockTransferRequest" DROP CONSTRAINT IF EXISTS "StockTransferRequest_createdById_fkey";
ALTER TABLE "StockTransferRequest" ADD CONSTRAINT "StockTransferRequest_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "StockTransferRequest" DROP CONSTRAINT IF EXISTS "StockTransferRequest_approvedById_fkey";
ALTER TABLE "StockTransferRequest" ADD CONSTRAINT "StockTransferRequest_approvedById_fkey" FOREIGN KEY ("approvedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "StockMovement" DROP CONSTRAINT IF EXISTS "StockMovement_shopCode_fkey";
ALTER TABLE "StockMovement" ADD CONSTRAINT "StockMovement_shopCode_fkey" FOREIGN KEY ("shopCode") REFERENCES "Shop"("shopCode") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "StockMovement" DROP CONSTRAINT IF EXISTS "StockMovement_variantId_fkey";
ALTER TABLE "StockMovement" ADD CONSTRAINT "StockMovement_variantId_fkey" FOREIGN KEY ("variantId") REFERENCES "ProductVariant"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "StockMovement" DROP CONSTRAINT IF EXISTS "StockMovement_userId_fkey";
ALTER TABLE "StockMovement" ADD CONSTRAINT "StockMovement_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
