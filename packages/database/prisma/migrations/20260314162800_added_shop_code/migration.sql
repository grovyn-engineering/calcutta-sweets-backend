/*
  Warnings:

  - You are about to drop the column `shopId` on the `Product` table. All the data in the column will be lost.
  - You are about to drop the column `shopId` on the `User` table. All the data in the column will be lost.
  - Added the required column `shopCode` to the `Product` table without a default value. This is not possible if the table is not empty.
  - Added the required column `shopCode` to the `User` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "Product" DROP CONSTRAINT "Product_shopId_fkey";

-- DropForeignKey
ALTER TABLE "User" DROP CONSTRAINT "User_shopId_fkey";

-- AlterTable
ALTER TABLE "Product" DROP COLUMN "shopId",
ADD COLUMN     "shopCode" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "User" DROP COLUMN "shopId",
ADD COLUMN     "shopCode" TEXT NOT NULL;

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_shopCode_fkey" FOREIGN KEY ("shopCode") REFERENCES "Shop"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Product" ADD CONSTRAINT "Product_shopCode_fkey" FOREIGN KEY ("shopCode") REFERENCES "Shop"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
