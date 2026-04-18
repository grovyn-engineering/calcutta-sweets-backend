-- Instant / proportional POS lines (e.g. 400g from a kg-priced SKU)
ALTER TABLE "OrderItem" ALTER COLUMN "quantity" SET DATA TYPE DOUBLE PRECISION USING "quantity"::double precision;

ALTER TABLE "ProductVariant" ALTER COLUMN "quantity" SET DATA TYPE DOUBLE PRECISION USING "quantity"::double precision;

ALTER TABLE "ProductVariant" ALTER COLUMN "minStock" SET DATA TYPE DOUBLE PRECISION USING "minStock"::double precision;
