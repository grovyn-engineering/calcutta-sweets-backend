-- Bill numbers become one continuous, digits-only series per shop ("000042"),
-- shared by POS and website sales and never reset at the financial year.
--
-- Safe for existing data: no Order row is updated. Bills already issued keep the
-- number printed on them (legacy NULL billNo, numeric, or "yy-yy/NNNNNN").

-- ---------------------------------------------------------------------------
-- 1. Per-shop counter "BILL-<shopCode>", started above every number already used in
--    that shop, so a new bill can never repeat one: numeric bill numbers, the digits
--    of any "yy-yy/NNNNNN" bill, and the old per-FY counters "<shopCode>-FY<yy>".
-- ---------------------------------------------------------------------------
INSERT INTO "InvoiceSequence" ("id", "current")
SELECT
  'BILL-' || s."shopCode",
  GREATEST(
    COALESCE((
      SELECT MAX(o."billNo"::bigint)
      FROM "Order" o
      WHERE o."shopCode" = s."shopCode" AND o."billNo" ~ '^[0-9]{1,9}$'
    ), 0),
    COALESCE((
      SELECT MAX(split_part(o."billNo", '/', 2)::bigint)
      FROM "Order" o
      WHERE o."shopCode" = s."shopCode" AND o."billNo" ~ '^[0-9]{2}-[0-9]{2}/[0-9]{1,9}$'
    ), 0),
    COALESCE((
      SELECT MAX(q."current")
      FROM "InvoiceSequence" q
      WHERE left(q."id", length(s."shopCode") + 3) = s."shopCode" || '-FY'
    ), 0)
  )::int
FROM "Shop" s
ON CONFLICT ("id") DO UPDATE
  SET "current" = GREATEST("InvoiceSequence"."current", EXCLUDED."current");

-- ---------------------------------------------------------------------------
-- 2. Guard bill numbers in the database:
--    - a newly assigned bill number (INSERT, or NULL -> value when a website order is
--      paid) must be digits only;
--    - an issued bill number can never be changed or cleared.
--    A trigger rather than a CHECK constraint: a CHECK (even NOT VALID) is re-evaluated
--    on every UPDATE of a row, which would block cancelling historical bills whose
--    number predates this format. Other columns of existing rows stay editable.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION "order_bill_no_guard"() RETURNS trigger AS $$
BEGIN
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
  BEFORE INSERT OR UPDATE OF "billNo" ON "Order"
  FOR EACH ROW EXECUTE FUNCTION "order_bill_no_guard"();

-- The old "<shopCode>-FY<yy>" counters are no longer used and are kept for audit.
