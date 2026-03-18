-- DropForeignKey
ALTER TABLE "Product" DROP CONSTRAINT "Product_shopCode_fkey";

-- DropForeignKey
ALTER TABLE "User" DROP CONSTRAINT "User_shopCode_fkey";

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_shopCode_fkey" FOREIGN KEY ("shopCode") REFERENCES "Shop"("shopCode") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Product" ADD CONSTRAINT "Product_shopCode_fkey" FOREIGN KEY ("shopCode") REFERENCES "Shop"("shopCode") ON DELETE RESTRICT ON UPDATE CASCADE;
