-- POS payment modes: separate UPI and CARD, SPLIT for multi-mode bills, per-leg records,
-- and cash tendered / change. UPI_CARD stays for existing orders. No backfill: orders
-- without OrderPayment rows are read as one leg of paymentMethod for totalAmount.

-- AlterEnum (ADD VALUE cannot be used in the same transaction it is added in; not used below)
ALTER TYPE "PaymentMethod" ADD VALUE IF NOT EXISTS 'UPI';
ALTER TYPE "PaymentMethod" ADD VALUE IF NOT EXISTS 'CARD';
ALTER TYPE "PaymentMethod" ADD VALUE IF NOT EXISTS 'SPLIT';

-- CreateEnum
CREATE TYPE "PaymentLegMethod" AS ENUM ('CASH', 'UPI', 'CARD');

-- AlterTable
ALTER TABLE "Order" ADD COLUMN "cashTendered" DECIMAL(12,2),
ADD COLUMN "changeDue" DECIMAL(12,2);

-- CreateTable
CREATE TABLE "OrderPayment" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "method" "PaymentLegMethod" NOT NULL,
    "amount" DECIMAL(12,2) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "OrderPayment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "OrderPayment_orderId_idx" ON "OrderPayment"("orderId");

-- AddForeignKey
ALTER TABLE "OrderPayment" ADD CONSTRAINT "OrderPayment_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE CASCADE ON UPDATE CASCADE;
