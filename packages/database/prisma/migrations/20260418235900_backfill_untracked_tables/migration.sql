-- Backfill for tables that exist in production but were created outside migrations
-- (likely `prisma db push`), so `migrate deploy` could not build a fresh database.
-- Fully idempotent: on production every statement is a no-op.

DO $$ BEGIN
  CREATE TYPE "RequestStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE "TransferStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'FULFILLED');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS "RoleRequest" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "shopCode" TEXT NOT NULL,
    "requestedRole" "UserRole" NOT NULL,
    "status" "RequestStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "RoleRequest_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "StockTransferRequest" (
    "id" TEXT NOT NULL,
    "fromShopCode" TEXT NOT NULL,
    "toShopCode" TEXT NOT NULL,
    "status" "TransferStatus" NOT NULL DEFAULT 'PENDING',
    "note" TEXT,
    "createdById" TEXT,
    "approvedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "StockTransferRequest_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "StockTransferItem" (
    "id" TEXT NOT NULL,
    "requestId" TEXT NOT NULL,
    "barcode" TEXT NOT NULL,
    "productName" TEXT NOT NULL,
    "variantName" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    CONSTRAINT "StockTransferItem_pkey" PRIMARY KEY ("id")
);

DO $$ BEGIN
  ALTER TABLE "RoleRequest" ADD CONSTRAINT "RoleRequest_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  ALTER TABLE "RoleRequest" ADD CONSTRAINT "RoleRequest_shopCode_fkey" FOREIGN KEY ("shopCode") REFERENCES "Shop"("shopCode") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  ALTER TABLE "StockTransferRequest" ADD CONSTRAINT "StockTransferRequest_fromShopCode_fkey" FOREIGN KEY ("fromShopCode") REFERENCES "Shop"("shopCode") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  ALTER TABLE "StockTransferRequest" ADD CONSTRAINT "StockTransferRequest_toShopCode_fkey" FOREIGN KEY ("toShopCode") REFERENCES "Shop"("shopCode") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  ALTER TABLE "StockTransferItem" ADD CONSTRAINT "StockTransferItem_requestId_fkey" FOREIGN KEY ("requestId") REFERENCES "StockTransferRequest"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
