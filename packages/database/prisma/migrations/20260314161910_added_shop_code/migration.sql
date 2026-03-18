/*
  Warnings:

  - A unique constraint covering the columns `[shopCode]` on the table `Shop` will be added. If there are existing duplicate values, this will fail.
  - Made the column `barcode` on table `Product` required. This step will fail if there are existing NULL values in that column.
  - Added the required column `shopCode` to the `Shop` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Product" ALTER COLUMN "barcode" SET NOT NULL;

-- AlterTable
ALTER TABLE "Shop" ADD COLUMN     "shopCode" TEXT NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "Shop_shopCode_key" ON "Shop"("shopCode");
