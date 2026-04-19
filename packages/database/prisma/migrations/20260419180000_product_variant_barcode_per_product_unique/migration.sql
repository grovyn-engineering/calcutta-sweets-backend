-- Barcode is unique per product (same CS code can exist on factory + retail clone rows).
DROP INDEX IF EXISTS "ProductVariant_barcode_key";

CREATE UNIQUE INDEX "ProductVariant_productId_barcode_key" ON "ProductVariant"("productId", "barcode");
