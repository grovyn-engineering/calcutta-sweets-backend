-- Bills issued before bill numbers existed printed a reference derived from the order id
-- (dashboard `orderIdToInvoiceRef`: first 12 hex chars of the id, upper-case, unchanged
-- since 2026-03-29). Store that exact reference once so those bills stay findable,
-- reportable and reprint identically. They are NOT renumbered: the printed receipts and
-- any GST filings keep matching.

-- 1. Column + search index (nullable: new orders never get one).
ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS "legacyBillRef" TEXT;
CREATE INDEX IF NOT EXISTS "Order_shopCode_legacyBillRef_idx" ON "Order"("shopCode", "legacyBillRef");

-- 2. Backfill only bills that were actually issued (paid or later cancelled) without a
--    bill number. Drafts/pending website orders were never billed and are left alone;
--    they get a normal bill number if they are paid later.
--    Updates only "legacyBillRef", so the billNo guard trigger does not fire.
UPDATE "Order"
SET "legacyBillRef" = upper(left(replace("id", '-', ''), 12))
WHERE "billNo" IS NULL
  AND "legacyBillRef" IS NULL
  AND "status" IN ('PAID', 'CANCELLED');

-- 3. Extend the guard (after the backfill): legacy references are write-once history.
--    - never set on a new order or added later;
--    - never changed or cleared;
--    - a legacy bill is not given a second (numeric) bill number.
--    billNo rules are unchanged from 20261017130000_numeric_bill_numbers.
CREATE OR REPLACE FUNCTION "order_bill_no_guard"() RETURNS trigger AS $$
BEGIN
  IF TG_OP = 'INSERT' AND NEW."legacyBillRef" IS NOT NULL THEN
    RAISE EXCEPTION 'legacyBillRef is only for bills issued before bill numbers existed'
      USING ERRCODE = 'check_violation';
  END IF;
  IF TG_OP = 'UPDATE' AND NEW."legacyBillRef" IS DISTINCT FROM OLD."legacyBillRef" THEN
    RAISE EXCEPTION 'legacyBillRef cannot be set or changed (was %)', COALESCE(OLD."legacyBillRef", 'empty')
      USING ERRCODE = 'check_violation';
  END IF;
  IF TG_OP = 'UPDATE' AND OLD."legacyBillRef" IS NOT NULL
     AND NEW."billNo" IS DISTINCT FROM OLD."billNo" THEN
    RAISE EXCEPTION 'Bill % was issued with a legacy reference and cannot get a bill number',
      OLD."legacyBillRef"
      USING ERRCODE = 'check_violation';
  END IF;

  IF TG_OP = 'UPDATE' AND OLD."billNo" IS NOT NULL
     AND NEW."billNo" IS DISTINCT FROM OLD."billNo" THEN
    RAISE EXCEPTION 'Bill number % is already issued and cannot be changed', OLD."billNo"
      USING ERRCODE = 'check_violation';
  END IF;
  IF NEW."billNo" IS NOT NULL
     AND (TG_OP = 'INSERT' OR OLD."billNo" IS NULL)
     AND NEW."billNo" !~ '^[0-9]+$' THEN
    RAISE EXCEPTION 'Bill number % must contain digits only', NEW."billNo"
      USING ERRCODE = 'check_violation';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS "Order_billNo_guard" ON "Order";
CREATE TRIGGER "Order_billNo_guard"
  BEFORE INSERT OR UPDATE OF "billNo", "legacyBillRef" ON "Order"
  FOR EACH ROW EXECUTE FUNCTION "order_bill_no_guard"();
