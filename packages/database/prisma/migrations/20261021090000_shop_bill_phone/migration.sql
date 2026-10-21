-- Bill contact number changed to the Raipur landline (0771 4060082).
-- Only shops still carrying the old number are touched; idempotent.
UPDATE "Shop"
SET "phone" = '0771 4060082', "updatedAt" = NOW()
WHERE regexp_replace(COALESCE("phone", ''), '\D', '', 'g') IN ('9993060082', '919993060082');
